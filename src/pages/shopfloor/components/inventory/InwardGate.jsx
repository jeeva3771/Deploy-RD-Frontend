import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Package, Scale, X, Loader2 } from 'lucide-react';
import { fetchInwardLogs } from '../../../../reducer/shopFloorReducer';
import Pagination from './Pagination';

const InwardGate = ({ isUv, department, processNames }) => {
    const dispatch = useDispatch();
    const { jobs } = useSelector(state => state.shopFloor);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const dept = department || (isUv ? 'Print' : 'Laser');

    useEffect(() => {
        const loadLogs = async () => {
            try {
                const params = {};
                if (processNames) {
                    params.process_name = processNames;
                } else {
                    params.department = dept;
                }
                const res = await dispatch(fetchInwardLogs(params)).unwrap();
                if (res.success) {
                    setLogs(res.data);
                }
            } catch (error) {
                console.error("Failed to fetch inward logs:", error);
            } finally {
                setLoading(false);
            }
        };
        loadLogs();
    }, [dispatch, dept, jobs, processNames]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Inward History...</span>
            </div>
        );
    }

    const totalPages = Math.ceil(logs.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedLogs = logs.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100">
                        <Package className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="text-[11px] font-[1000] text-emerald-800 uppercase tracking-widest">MATERIAL INWARD LOG</h3>
                        <p className="text-[8px] font-black text-emerald-600/60 uppercase tracking-widest mt-0.5">Auto-populated from operator acceptances. Head can edit incorrect entries.</p>
                    </div>
                </div>
                <div className="px-3 py-1 bg-slate-100 rounded-full">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{logs.length} TOTAL ENTRIES</span>
                </div>
            </div>

            <div className="space-y-4">
                {logs.length === 0 ? (
                    <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-12 flex flex-col items-center justify-center text-center">
                        <Package className="w-8 h-8 text-slate-300 mb-3" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No inward records found yet.</p>
                    </div>
                ) : (
                    paginatedLogs.map((log, i) => (
                        <div key={log._id || i} className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden group hover:border-emerald-300 transition-all">
                            <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="text-base sm:text-lg font-[1000] text-emerald-600 italic tracking-tight">{log.inward_number}</h4>
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] font-black rounded uppercase tracking-widest truncate max-w-full">
                                            JOB: {log.job_no}/{log.sub_job_no}
                                        </span>
                                    </div>
                                    <p className="text-[9px] sm:text-[10px] font-black text-slate-700 uppercase tracking-wide mt-0.5 truncate">{log.material_name} • {log.size}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{log.timestamp} · {log.operator_name}</p>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-4 shrink-0 justify-between sm:justify-end">
                                    <div className="flex gap-1.5 sm:gap-2 w-full sm:w-auto">
                                        <div className="flex-1 sm:flex-none px-2 sm:px-3 py-1 sm:py-1.5 bg-slate-50 border border-slate-100 rounded-lg flex flex-col items-center min-w-[38px] sm:min-w-[45px]">
                                            <span className="text-[6.5px] sm:text-[7px] font-black text-slate-400 uppercase tracking-widest">TOTAL</span>
                                            <span className="text-xs sm:text-sm font-[1000] text-slate-800">{log.inspect_qty}</span>
                                        </div>
                                        <div className="flex-1 sm:flex-none px-2 sm:px-3 py-1 sm:py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg flex flex-col items-center min-w-[38px] sm:min-w-[45px]">
                                            <span className="text-[6.5px] sm:text-[7px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-0.5 sm:gap-1">GOOD <Scale className="w-2 h-2" /></span>
                                            <span className="text-xs sm:text-sm font-[1000] text-emerald-600">{log.good_qty}</span>
                                        </div>
                                        <div className="flex-1 sm:flex-none px-2 sm:px-3 py-1 sm:py-1.5 bg-slate-50 border border-slate-100 rounded-lg flex flex-col items-center min-w-[38px] sm:min-w-[45px]">
                                            <span className="text-[6.5px] sm:text-[7px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-0.5 sm:gap-1">BAD <X className="w-2 h-2" /></span>
                                            <span className="text-xs sm:text-sm font-[1000] text-rose-500">{log.bad_qty}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {(log.remarks || log.note) && (
                                <div className="bg-slate-50/50 px-3 sm:px-4 py-2 border-t border-slate-100">
                                    <p className="text-[8px] font-medium text-slate-500 italic">" {log.remarks || log.note} "</p>
                                </div>
                            )}
                            <div className="bg-[#0c1a2e] px-3 sm:px-4 py-2 flex items-center justify-between sm:justify-start gap-4 sm:gap-10">
                                <div className="flex flex-col">
                                    <span className="text-[6.5px] sm:text-[7px] font-black text-teal-400/50 uppercase tracking-widest">SQ.IN ACCEPTED</span>
                                    <span className="text-xs sm:text-sm font-[1000] text-teal-400 tracking-tighter">{log.total_sq_inch_accepted?.toLocaleString() || 0}</span>
                                </div>
                                <div className="flex flex-col border-l border-white/10 sm:border-white/5 pl-4 sm:pl-10">
                                    <span className="text-[6.5px] sm:text-[7px] font-black text-indigo-400/50 uppercase tracking-widest">₹ VALUE</span>
                                    <span className="text-xs sm:text-sm font-[1000] text-indigo-400 tracking-tighter uppercase">₹ {log.accepted_value?.toLocaleString() || 0}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={setItemsPerPage}
                totalCount={logs.length}
            />
        </div>
    );
};

export default InwardGate;
