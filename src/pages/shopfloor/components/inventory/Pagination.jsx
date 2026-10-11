import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    itemsPerPage,
    onItemsPerPageChange,
    totalCount
}) => {
    if (totalCount === 0) return null;

    const visiblePages = 3;
    let startPage = Math.max(1, currentPage - Math.floor(visiblePages / 2));
    let endPage = Math.min(totalPages, startPage + visiblePages - 1);

    if (endPage - startPage + 1 < visiblePages) {
        startPage = Math.max(1, endPage - visiblePages + 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalCount);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-white border border-emerald-100 rounded-2xl shadow-sm mt-6 animate-in fade-in duration-300">
            {/* Left: Show Entries dropdown */}
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                    SHOW
                </span>

                <div className="relative">
                    <select
                        value={itemsPerPage}
                        onChange={(e) => {
                            onItemsPerPageChange(Number(e.target.value));
                            onPageChange(1);
                        }}
                        className="
                            appearance-none
                            h-8
                            min-w-[70px]
                            rounded-lg
                            border border-slate-200
                            bg-slate-50
                            pl-3 pr-8
                            text-xs font-semibold text-slate-700
                            focus:outline-none
                            focus:ring-2 focus:ring-emerald-500
                            focus:border-emerald-500
                            cursor-pointer
                        "
                    >
                        {[10, 15, 20, 50].map((opt) => (
                            <option key={opt} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </select>

                    <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-slate-400">
                        <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 9l-7 7-7-7"
                            />
                        </svg>
                    </div>
                </div>

                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                    ENTRIES
                </span>
            </div>

            {/* Center: Showing entries info */}
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                SHOWING {totalCount === 0 ? 0 : startIndex + 1} TO {endIndex} OF {totalCount} RECORDS
            </div>

            {/* Right: Navigation buttons */}
            <div className="flex items-center gap-1.5">
                {/* Prev Button */}
                <button
                    onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
                >
                    <ChevronLeft className="w-3.5 h-3.5" strokeWidth={3} />
                </button>

                {/* Page Numbers */}
                {startPage > 1 && (
                    <>
                        <button
                            onClick={() => onPageChange(1)}
                            className={`w-8 h-8 rounded-xl text-[10px] font-black tracking-wider transition-all flex items-center justify-center border ${
                                currentPage === 1
                                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                                    : 'border-slate-200 text-slate-700 hover:bg-slate-50 hover:scale-105'
                            }`}
                        >
                            1
                        </button>
                        {startPage > 2 && <span className="text-[10px] font-black text-slate-400 px-1">...</span>}
                    </>
                )}

                {pages.map((pageNum) => (
                    <button
                        key={pageNum}
                        onClick={() => onPageChange(pageNum)}
                        className={`w-8 h-8 rounded-xl text-[10px] font-black tracking-wider transition-all flex items-center justify-center border ${
                            currentPage === pageNum
                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                                : 'border-slate-200 text-slate-700 hover:bg-slate-50 hover:scale-105'
                        }`}
                    >
                        {pageNum}
                    </button>
                ))}

                {endPage < totalPages && (
                    <>
                        {endPage < totalPages - 1 && <span className="text-[10px] font-black text-slate-400 px-1">...</span>}
                        <button
                            onClick={() => onPageChange(totalPages)}
                            className={`w-8 h-8 rounded-xl text-[10px] font-black tracking-wider transition-all flex items-center justify-center border ${
                                currentPage === totalPages
                                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                                    : 'border-slate-200 text-slate-700 hover:bg-slate-50 hover:scale-105'
                            }`}
                        >
                            {totalPages}
                        </button>
                    </>
                )}

                {/* Next Button */}
                <button
                    onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
                >
                    <ChevronRight className="w-3.5 h-3.5" strokeWidth={3} />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
