import { STAR_STAGES, getCountdown, fmtDate, fmtDateTime } from "./coordUtils";
import { FormControl, Select, MenuItem } from '@mui/material';

// JobCard
export function JobCard({ rfq, coordStage, onToggleSelect, onOpenLedger, onPreviewImage, onToggleEscalate }) {
    const countdown = getCountdown(rfq.poDeliveryDate);
    const isDelayed = rfq._isPostponed;
    const isEscalated = rfq.inwardAccounting?.isEscalated;
    const showStar = STAR_STAGES.has(coordStage);
    const awardedVendors = rfq.vendorName || "—";
    const eta = rfq.poDeliveryDate;

    // let cls = "job-card transition-all duration-300";
    // if (rfq._selected) cls += " selected";

    // // Priority: Escalated/Delayed > Qty Change > Date Change
    // if (coordStage === "ESCALATED" || isDelayed) {
    //     cls += " glow-red-delay";
    // }
    // else if (rfq.pendingQtyChange) {
    //     cls += " border-purple-600 border-dashed scale-[1.02] shadow-purple-100 shadow-lg";
    // } else if (rfq.pendingDateChange || rfq.pendingJobCompletionChange) {
    //     cls += " border-orange-600 border-dashed scale-[1.02] shadow-orange-100 shadow-lg";
    // }

    const actualIsOnHold = rfq.is_on_hold && coordStage !== "QC CHECK" && coordStage !== "STORES INWARD";

    // AFTER
    let cls = "job-card transition-all duration-300";
    if (rfq._selected) cls += " selected";
    if (coordStage === "ESCALATED" || isDelayed || isEscalated) cls += " glow-red-delay";

    const alertStyle = rfq.pendingQtyChange
        ? { border: "4px dashed #6b21a8", boxShadow: "0 0 20px rgba(107,33,168,0.5)", transform: "scale(1.02)" }
        : (rfq.pendingDateChange || rfq.pendingJobCompletionChange)
            ? { border: "4px dashed #ea580c", boxShadow: "0 0 20px rgba(234,88,12,0.4)", transform: "scale(1.02)" }
            : {};

    const imgSrc = rfq.org_image?.startsWith('http') ? rfq.org_image : `${import.meta.env.VITE_BACKEND_URL}/${rfq.org_image}`;

    return (
        // <div className={cls} onClick={() => onToggleSelect(rfq._id)}>
        <div className={`${cls} ${actualIsOnHold ? 'cursor-not-allowed select-none' : ''}`} style={alertStyle} onClick={() => onToggleSelect(rfq._id)}>
            <div className="flex justify-between items-start gap-4">
                <div className="flex gap-2">
                    {rfq.org_image && (
                        <div
                            onClick={(e) => { e.stopPropagation(); !actualIsOnHold && onPreviewImage && onPreviewImage(imgSrc); }}
                            className={`w-10 h-10 shrink-0 rounded-md overflow-hidden border border-slate-200 ${actualIsOnHold ? 'cursor-not-allowed' : 'cursor-zoom-in'}`}
                        >
                            <img src={imgSrc} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                    )}
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg text-[10px] font-black tracking-tighter uppercase italic h-[22px] flex items-center">
                                {rfq.subJobNo && rfq.subJobNo !== 'MANUAL' ? rfq.subJobNo : (rfq.jobNo || "—")}
                            </span>
                            {rfq.reference_no && (
                                <span className="text-slate-400 font-[1000] italic text-[11px] leading-tight tracking-normal">
                                    - {rfq.reference_no}
                                </span>
                            )}
                            {actualIsOnHold && (
                                <span
                                    style={{
                                       border: "2px solid red",
                                       color: "red",
                                       fontWeight: 1000,
                                       padding: "4px 10px",
                                       borderRadius: "10px",
                                       fontSize: "10px",
                                       backgroundColor: "rgba(255, 0, 0, 0.05)",
                                       fontStyle: "italic",
                                       textTransform: "uppercase",
                                       whiteSpace: "nowrap",
                                       lineHeight: 1,
                                       height: "24px",
                                       display: "flex",
                                       alignItems: "center"
                                   }}
                                   className="animate-pulse shadow-[0_0_8px_rgba(255,0,0,0.15)]"
                                >
                                    On Hold
                                </span>
                            )}
                        </div>
                        <div className="text-[9px] text-slate-400 font-bold tracking-tight uppercase italic opacity-70">
                            [{rfq.uid}]
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="text-slate-400 text-[10px] font-bold tracking-tighter uppercase italic">{rfq.poNumber}</div>
                    <div className="flex items-center gap-1">
                        {showStar && (
                            <button
                                onClick={e => { e.stopPropagation(); onOpenLedger(rfq._id); }}
                                className={`text-amber-500 text-xl font-black leading-none transition-all ${actualIsOnHold ? 'cursor-not-allowed opacity-50' : 'hover:scale-125'}`}
                                title={actualIsOnHold ? "Locked (On Hold)" : "Open Ledger"}
                            >★</button>
                        )}
                        {isDelayed && (
                            <span className="bg-red-600 text-[8px] text-white px-2 py-0.5 rounded-full font-black flex items-center gap-1 shadow-sm border border-white/20 uppercase tracking-tighter">
                                <span className="w-1 h-1 bg-white rounded-full animate-ping"></span> DATE ESCALATED
                            </span>
                        )}
                        {isEscalated && (
                            <span className="bg-orange-600 text-[8px] text-white px-2 py-0.5 rounded-full font-black flex items-center gap-1 shadow-sm border border-white/20 uppercase tracking-tighter">
                                ⚠️ QC ESCALATED
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <h3 className="text-center text-[14px] font-black text-slate-800 mt-4 mb-1 italic uppercase leading-tight">{rfq.name}</h3>
            <div className="text-center text-[10px] font-black text-slate-600">{rfq.qty} Nos</div>
            <div className={`eta-pill italic font-black uppercase ${isDelayed ? "bg-red-900 shadow-[0_0_15px_rgba(239,68,68,0.4)]" : ""}`}>
                {eta ? (
                    <>
                        <div className="text-[10px] font-black tracking-tight">
                            {fmtDate(eta)}
                        </div>
                        <div className="text-[10px] text-blue-300">
                            @ {new Date(eta).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </>
                ) : <div className="text-[10px]">—</div>}
                <div className="text-[10px] opacity-80 border-t border-white/20 pt-1 mt-1">{countdown}</div>
            </div>

            {/* {isEscalated && (
                <div className="mt-2 px-2 py-1.5 bg-red-50 border border-red-200 rounded-xl">
                    <div className="text-[8.5px] text-red-700 font-black tracking-widest uppercase mb-0.5">⚠️ QC ESCALATED</div>
                    {rfq.coordLogs?.find(l => l.action === "ESCALATED") && (
                        <div className="text-[9px] text-red-600 font-bold italic leading-tight line-clamp-2 opacity-80">
                            "{rfq.coordLogs.find(l => l.action === "ESCALATED").note}"
                        </div>
                    )}
                </div>
            )} */}

            {/* <button
                onClick={(e) => { e.stopPropagation(); onToggleEscalate(rfq._id); }}
                className={`w-full mt-3 py-2.5 rounded-xl border-2 flex items-center justify-center gap-2 text-[10px] font-black italic transition-all ${isEscalated
                    ? "bg-white border-red-600 text-red-600 shadow-sm"
                    : "border-red-600 text-red-600 hover:bg-red-50"
                    }`}
            >
                <span className="text-sm">⚠️</span>
                {isEscalated ? "DE-ESCALATE QC" : "ESCALATE QC"}
            </button> */}
        </div>
    );
}

// KanbanColumn
export function KanbanColumn({ col, cards, onBatchAll, onToggleSelect, onOpenLedger, onPreviewImage, onToggleEscalate }) {
    const filtered = cards.filter(c => c._coordStage === col);
    return (
        <div className="kanban-col shadow-sm">
            <div className={`p-4 ${col === "ESCALATED" ? "bg-red-600" : "bg-slate-900"} text-white rounded-t-[10px] flex justify-between items-center flex-shrink-0`}>
                <div>
                    <div className="text-[10px] tracking-widest">{col}</div>
                    <div className="text-[10px] opacity-70 mt-0.5">{filtered.length} JOBS</div>
                </div>
                <button
                    onClick={() => onBatchAll(col)}
                    className="text-[9px] bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded-lg font-black italic transition-colors"
                >BATCH ALL</button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto min-h-0 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50 scroll-auto">
                {filtered.length === 0
                    ? <div className="text-center py-10 text-[9px] text-slate-300 tracking-widest">NO JOBS</div>
                    : filtered.map(rfq => (
                        <JobCard
                            key={rfq._id}
                            rfq={rfq}
                            coordStage={col}
                            onToggleSelect={onToggleSelect}
                            onOpenLedger={onOpenLedger}
                            onPreviewImage={onPreviewImage}
                            onToggleEscalate={onToggleEscalate}
                        />
                    ))
                }
            </div>
        </div>
    );
}

// CoordHeader
export function CoordHeader({ tab, setTab, totalCards, overdueCount, showFilter, selectedCreator, setSelectedCreator, creators, qtyCount, dateCount,
    filterToday, setFilterToday,
    onOpenQty, onOpenDate,
    onRefresh, loading,
    searchTerm, setSearchTerm }) {
    return (
        <header className="bg-white border-b px-4 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm z-10 flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
                <div>
                    <h1 className="text-xl sm:text-2xl italic font-black uppercase tracking-tighter text-slate-800 underline decoration-blue-500 decoration-4 cursor-default">Procurement Coordination</h1>
                    <p className="text-[9px] text-slate-400 mt-0.5 tracking-widest">{totalCards} ACTIVE POs &nbsp;|&nbsp; <span className="text-red-500">{overdueCount} OVERDUE</span></p>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-300 font-black overflow-x-auto">
                    {["VENDOR", "MATERIAL", "JOB"].map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`whitespace-nowrap px-4 sm:px-6 py-2 rounded-xl text-[11px] transition-all uppercase text-black-100 ${tab === t ? "bg-white shadow-md text-blue-600" : "opacity-50 hover:opacity-70"}`}
                        >{t}</button>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-4">
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
                                    className="text-[11px] font-black"
                                    style={{ whiteSpace: "nowrap" }}
                                >
                                    <span className="pr-4">{creator.name} - <span className="opacity-60 text-[14px]">{creator.role?.name || "N/A"}</span></span>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}


                <div className="flex flex-wrap items-center gap-2 sm:gap-4 shrink-0">
                    {/* Search Bar */}
                    <div className="relative group mr-2">
                        <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors text-xs"></i>
                        <input
                            type="text"
                            placeholder="SEARCH BY JOB / PO / VENDOR / REF..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white border-2 border-slate-200 rounded py-2 pl-9 pr-10 w-52 sm:w-72 text-[10px] font-black italic uppercase tracking-wider focus:outline-none focus:border-blue-500 transition-all shadow-sm h-[32px]"
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
                    {/* {qtyCount > 0 && ( */}
                    <button
                        onClick={onOpenQty}
                        className={`px-4 py-2 sm:py-3 rounded-2xl text-[10px] sm:text-[10px] bg-purple-600 text-white shadow-lg flex items-center gap-2 font-black italic uppercase hover:scale-105 transition-transform ${qtyCount > 0 ? 'bg-purple-800 ring-2 ring-purple-300' : 'bg-purple-600 hover:bg-purple-700'} ${qtyCount > 0 ? 'animate-pulse' : ''}`}
                    >
                        ⚖ QTY ALERT ({qtyCount})
                    </button>
                    {/* )} */}
                    {/* {dateCount > 0 && ( */}
                    <button
                        onClick={onOpenDate}
                        className={`px-4 py-2 sm:py-3 bg-orange-600 text-white rounded-2xl text-[10px] sm:text-[10px] shadow-lg flex items-center gap-2 font-black italic uppercase hover:scale-105 transition-transform ${dateCount > 0 ? 'bg-orange-700 ring-2 ring-orange-200' : 'bg-orange-500 hover:bg-orange-600'} ${dateCount > 0 ? 'animate-pulse' : ''}`}
                    >
                        📅 DATE CHANGE ({dateCount})
                    </button>
                    {/* )} */}
                    <button
                        onClick={() => setFilterToday(!filterToday)}
                        className={`px-4 py-2 sm:py-3 rounded-2xl text-[9px] sm:text-[10px] uppercase font-black transition-all border-2 ${filterToday ? "bg-red-500 text-white border-red-500 shadow-md ring-2 ring-red-100" : "border-slate-200 text-slate-400 bg-slate-50 hover:bg-slate-100"}`}
                    >
                        DUE TODAY
                    </button>
                    {/* <button
                        onClick={onRefresh}
                        disabled={loading}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 border border-slate-200 text-[9px] font-black italic uppercase hover:bg-slate-200 transition-colors disabled:opacity-50"
                    >
                        {loading ? "⏳ Loading..." : "↻ Refresh"}
                    </button> */}
                </div>
            </div>
        </header>
    );
}
