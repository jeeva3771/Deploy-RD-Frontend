import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllStoreIssues, migrateExistingStoreJobs } from "../../reducer/storeReducer";
import { capitalizeFirst } from "../../utils/helper/capitalize";
import { toast } from "react-toastify";
import StoreMaterialIssuePanel from "./components/StoreMaterialIssuePanel";
import ImageLightbox from "../common/ImageLightbox";
import DeliveryPriorityColor from "../../components/deliveryPriorityColor/priorityColor";
import { usePriorityColors } from "../../context/PriorityColorContext";

const MaterialIssue = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { issues, loading } = useSelector((state) => state.store);
    const [activeTab, setActiveTab] = useState("");
    const [activeDropdown, setActiveDropdown] = useState(null); // null, 'qty', 'date'
    const [isSyncing, setIsSyncing] = useState(false);
    const [selectedJobId, setSelectedJobId] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const qtyDropdownRef = React.useRef(null);
    const dateDropdownRef = React.useRef(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Derive the selected job from the store to ensure it's always the latest data
    const selectedJob = issues.find(i => i._id === selectedJobId);

    useEffect(() => {
        dispatch(fetchAllStoreIssues({ search: debouncedSearch }));
    }, [dispatch, debouncedSearch]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (activeDropdown === 'qty' && qtyDropdownRef.current && !qtyDropdownRef.current.contains(event.target)) {
                setActiveDropdown(null);
            }
            if (activeDropdown === 'date' && dateDropdownRef.current && !dateDropdownRef.current.contains(event.target)) {
                setActiveDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeDropdown]);

    const qtyChangeCount = issues.filter(i => i.is_qty_changed).length;
    const dateChangeCount = issues.filter(i => i.is_date_changed).length;
    const qtyAlertJobs = issues.filter(i => i.is_qty_changed);
    const dateAlertJobs = issues.filter(i => i.is_date_changed);

    const handleSync = async () => {
        try {
            setIsSyncing(true);
            await dispatch(migrateExistingStoreJobs()).unwrap();
            toast.success("Synced successfully!");
            dispatch(fetchAllStoreIssues());
        } catch (err) {
            toast.error(err?.message || "Sync failed");
        } finally {
            setIsSyncing(false);
        }
    };

    const getIssuesByStatus = (status) => {
        let filtered = issues.filter(issue => issue.status === status);
        if (activeTab === 'Qty Alerts') return filtered.filter(i => i.is_qty_changed);
        if (activeTab === 'Date Alerts') return filtered.filter(i => i.is_date_changed);
        if (activeTab === 'Issue Today') {
            const d = new Date();
            const today = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
            return filtered.filter(i => {
                const compDate = i.job_completion_date || "";
                return compDate.startsWith(today);
            });
        }
        return filtered;
    };

    const sections = [
        {
            title: "ALERT ESCALATIONS",
            key: 'ALERT',
            headerColor: "bg-[#F05252]",
            bodyColor: "bg-[#F8FAFC]",
            cardBorder: "border-[#F05252]",
            cardBg: "bg-[#FFF5F5]",
        },
        {
            title: "NEW REQUEST",
            key: 'NEW',
            headerColor: "bg-[#1F2937]",
            bodyColor: "bg-[#F8FAFC]",
            cardBorder: "border-[#E2E8F0]",
            cardBg: "bg-white",
        },
        {
            title: "PARTIAL ISSUE",
            key: 'PARTIAL',
            headerColor: "bg-[#B45309]",
            bodyColor: "bg-[#F8FAFC]",
            cardBorder: "border-[#B45309]",
            cardBg: "bg-[#FFFBEB]",
        },
        {
            title: "ISSUED",
            key: 'ISSUED',
            headerColor: "bg-[#059669]",
            bodyColor: "bg-[#F8FAFC]",
            cardBorder: "border-[#059669]",
            cardBg: "bg-[#F0FDF4]",
        }
    ];

    return (
        <div className="bg-white p-6 mt-5" style={{ minHeight: "calc(100vh - 200px)" }}>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 px-2 gap-4">
                <div>
                    <h1 className="text-3xl font-[1000] italic text-[#111827] tracking-tighter uppercase leading-none">
                        Material Issue
                    </h1>
                </div>
                <div className="flex flex-wrap items-center gap-4">

                    {/* <button
                        onClick={() => navigate('/store/material-purchase-request')}
                        className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-all active:scale-95 text-xs uppercase"
                    >
                        <i className="fas fa-shopping-cart"></i>
                        <span>New Purchase Request</span>
                    </button> */}

                    {/* Search Bar */}
                    <div className="relative group">
                        <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors text-xs"></i>
                        <input
                            type="text"
                            placeholder="SEARCH BY JOB / SUB JOB NO / REF..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white border-2 border-slate-200 rounded py-2 pl-9 pr-10 w-56 sm:w-80 text-[10px] font-black italic uppercase tracking-wider focus:outline-none focus:border-blue-500 transition-all shadow-sm h-[38px]"
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

                    {/* QTY Alert Dropdown Container */}
                    <div className="relative" ref={qtyDropdownRef}>
                        <button
                            onClick={() => setActiveDropdown(activeDropdown === 'qty' ? null : 'qty')}
                            className={`text-white text-xs font-black py-2.5 px-6 rounded flex items-center shadow-lg transition-all active:scale-95 italic uppercase tracking-wider ${activeDropdown === 'qty' ? 'bg-purple-800 ring-2 ring-purple-300' : 'bg-purple-600 hover:bg-purple-700'} ${qtyChangeCount > 0 ? 'animate-pulse' : ''}`}
                            disabled={qtyChangeCount === 0}
                        >
                            <i className="fa-solid fa-pen-to-square mr-2"></i>
                            QTY ALERT ({qtyChangeCount})
                        </button>
                        {activeDropdown === 'qty' && qtyChangeCount > 0 && (
                            <div className="absolute top-full mt-2 right-0 w-64 bg-white border-2 border-purple-500 rounded-lg shadow-xl z-50 overflow-hidden">
                                <div className="p-3 border-b border-purple-100 bg-purple-50">
                                    <h3 className="font-bold text-purple-800 text-sm italic uppercase tracking-tight">Quantity Changes</h3>
                                </div>
                                <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-white scroll-auto bg-white">
                                    {qtyAlertJobs.map(item => (
                                        <div
                                            key={item._id}
                                            onClick={() => {
                                                setSelectedJobId(item._id);
                                                setActiveDropdown(null);
                                            }}
                                            className="p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                                        >
                                            <div className="text-xs font-[1000] italic text-[#1e293b] leading-tight uppercase underline">{item.sub_job_no}</div>
                                            <div className="text-[10px] font-black text-slate-500 italic mt-1 uppercase truncate opacity-70">{item.client_name || 'N/A'}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Date Change Dropdown Container */}
                    <div className="relative" ref={dateDropdownRef}>
                        <button
                            onClick={() => setActiveDropdown(activeDropdown === 'date' ? null : 'date')}
                            className={`text-white text-xs font-black py-2.5 px-6 rounded flex items-center shadow-lg transition-all active:scale-95 italic uppercase tracking-wider ${activeDropdown === 'date' ? 'bg-orange-700 ring-2 ring-orange-200' : 'bg-orange-500 hover:bg-orange-600'} ${dateChangeCount > 0 ? 'animate-pulse' : ''}`}
                            disabled={dateChangeCount === 0}
                        >
                            <i className="fa-solid fa-calendar-day mr-2"></i>
                            DATE CHANGE ({dateChangeCount})
                        </button>
                        {activeDropdown === 'date' && dateChangeCount > 0 && (
                            <div className="absolute top-full mt-2 right-0 w-64 bg-white border-2 border-orange-500 rounded-lg shadow-xl z-50 overflow-hidden">
                                <div className="p-3 border-b border-orange-100 bg-orange-50">
                                    <h3 className="font-bold text-orange-800 text-sm italic uppercase tracking-tight">Preponed Jobs</h3>
                                </div>
                                <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-white scroll-auto bg-white">
                                    {dateAlertJobs.map(item => (
                                        <div
                                            key={item._id}
                                            onClick={() => {
                                                setSelectedJobId(item._id);
                                                setActiveDropdown(null);
                                            }}
                                            className="p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                                        >
                                            <div className="text-xs font-[1000] italic text-[#1e293b] leading-tight uppercase underline">{item.sub_job_no}</div>
                                            <div className="text-[10px] font-black text-slate-500 italic mt-1 uppercase truncate opacity-70">{item.client_name || 'N/A'}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer bg-white px-5 py-2 rounded border-2 border-slate-100 hover:border-slate-200 transition-all shadow-sm">
                        <input
                            type="checkbox"
                            checked={activeTab === 'Issue Today'}
                            onChange={(e) => setActiveTab(e.target.checked ? 'Issue Today' : '')}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-xs font-black text-slate-700 uppercase italic tracking-tight">Issue Today</span>
                    </label>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 h-[calc(100vh-215px)]">
                {sections.map((section, idx) => {
                    const items = getIssuesByStatus(section.key);
                    return (
                        <div key={idx} className={`${section.bodyColor} rounded-[2.5rem] shadow-[0_15px_40px_-10px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden border border-gray-200`}>
                            {/* Section Header */}
                            <div className={`${section.headerColor} p-4 px-8 flex justify-between items-center text-white rounded-t-[2.5rem] ${section.key === 'ALERT' ? 'animate-pulse' : ''}`}>
                                <span className="font-black text-lg italic tracking-tighter uppercase">{section.title}</span>
                                <span className="font-black text-xl italic">{items.length}</span>
                            </div>

                            {/* List */}
                            <div className="flex-1 overflow-y-auto mt-2 mb-6 px-5 pb-2 space-y-4 pt-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent scroll-auto">
                                {loading ? (
                                    <div className="flex justify-center py-10 opacity-20">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
                                    </div>
                                ) : items.length === 0 ? (
                                    <div className="flex flex-col items-center py-20 opacity-30 italic">
                                        <i className="fa-solid fa-folder-open text-3xl mb-2"></i>
                                        <span className="text-[10px] uppercase font-black tracking-widest">No Requests</span>
                                    </div>
                                ) : items.map((item, i) => (
                                    <div
                                        key={i}
                                        onClick={() => setSelectedJobId(item._id)}
                                        className={`${section.cardBg} border-2 ${section.cardBorder} rounded-3xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden pl-7 
                                            ${item.is_qty_changed ? 'blink-border-purple' : ''} 
                                            ${item.is_date_changed ? 'blink-border-orange' : ''}
                                        `}
                                    >
                                        {/* Priority Indicator Line */}
                                        <DeliveryPriorityColor
                                            deliveryDate={item.job_completion_date || item.delivery_date}
                                            className="absolute left-0 top-0 bottom-0 w-2 h-full"
                                            containerStyle={{ display: 'block', position: 'absolute', left: 0, top: 0, bottom: 0, width: '8px' }}
                                        />
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-blue-600 font-[1000] italic underline text-[12px] leading-tight tracking-normal">
                                                    {item.sub_job_no}
                                                </span>
                                                {item.reference_no && (
                                                    <span className="text-slate-400 font-[1000] italic text-[12px] leading-tight tracking-normal">
                                                        - {item.reference_no}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 -mr-2">
                                                {item.is_on_hold && (
                                                    <div className="bg-red-600 text-white text-[10px] px-3 py-1 rounded-lg animate-pulse font-black shadow-lg shadow-red-500/20 italic uppercase whitespace-nowrap">
                                                        ON HOLD
                                                    </div>
                                                )}
                                                <DeliveryPriorityColor
                                                    deliveryDate={item.job_completion_date || item.delivery_date}
                                                    showPriorityName={true}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-4 items-center mb-4">
                                            {/* Thumbnail with Preview Trigger */}
                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPreviewImage(item.product_image);
                                                }}
                                                className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-100 shadow-sm relative group/thumb"
                                            >
                                                {item.product_image ? (
                                                    <img
                                                        src={item.product_image}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                        <i className="fa-solid fa-image text-xl"></i>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                                                    <i className="fa-solid fa-magnifying-glass-plus text-white text-[10px]"></i>
                                                </div>
                                            </div>

                                            <h3 className="flex-1 text-[#1E293B] font-[1000] italic text-base leading-tight group-hover:text-[#3B82F6] transition-colors uppercase truncate">
                                                {item.product_name}
                                            </h3>
                                        </div>

                                        <div className="bg-slate-50 rounded-xl py-1.5 px-4 flex justify-center items-center border border-dashed border-slate-200">
                                            <div>
                                                <span className="text-[#64748B] font-black italic text-[9px] tracking-widest leading-none uppercase mr-2">Delivery Date:</span>
                                                <span className="text-[#1E293B] font-black italic text-[10px] tracking-tight">{item.job_completion_date || 'TBD'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Common Image Lightbox */}
            <ImageLightbox
                src={previewImage}
                fileName={previewImage?.split('/').pop().split('---').pop() || 'Product Preview'}
                onClose={() => setPreviewImage(null)}
            />

            {/* Right Side Panel */}
            <StoreMaterialIssuePanel
                isOpen={!!selectedJobId}
                job={selectedJob}
                onClose={() => setSelectedJobId(null)}
            />

            <style>{`
                @keyframes blink-purple {
                    0%, 100% { border-color: #9333ea; box-shadow: 0 0 5px #9333ea; }
                    50% { border-color: transparent; box-shadow: none; }
                }
                @keyframes blink-orange {
                    0%, 100% { border-color: #f97316; box-shadow: 0 0 5px #f97316; }
                    50% { border-color: transparent; box-shadow: none; }
                }
                .blink-border-purple {
                    animation: blink-purple 1.5s infinite;
                    border-width: 3px !important;
                }
                .blink-border-orange {
                    animation: blink-orange 1.5s infinite;
                    border-width: 3px !important;
                }
                h1, h2, h3, h4, p, span, button {
                    font-family: 'Plus Jakarta Sans', sans-serif !important;
                }
            `}</style>
        </div>
    );
};

export default MaterialIssue;
