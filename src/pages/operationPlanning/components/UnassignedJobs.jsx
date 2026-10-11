import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTeamProductionJobs } from '../../../reducer/assemblyTeamJobReducer';
import { useLoader } from '../../../context/LoaderContext';
import AssignProductionModal from './AssignProductionModal';
import JobDetailsDrawer from './JobDetailsDrawer';
import Pagination from '../../components/Pagination';
import ImageLightbox from '../../common/ImageLightbox';
import moment from 'moment';
import DeliveryPriorityColor from '../../../components/deliveryPriorityColor/priorityColor';
const UnassignedJobs = ({ onAssignClick, refreshKey, searchTerm }) => {
    const dispatch = useDispatch();
    const { loading, teamJobs } = useSelector((state) => state.assemblyTeamJob);
    const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
    const [viewData, setViewData] = useState(null);
    const [lightboxImg, setLightboxImg] = useState(null);

    // Pagination State
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(8);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [unassignedJobs, setUnassignedJobs] = useState([]);
    const [activeFilter, setActiveFilter] = useState('all'); // all, qty, date, overdue
    const [counts, setCounts] = useState({ all: 0, qty: 0, date: 0, overdue: 0 });

    // Scroll handling
    const scrollRef = useRef(null);

    const fetchAllJobs = useCallback(async (p = 1) => {
        try {
            const res = await dispatch(fetchTeamProductionJobs({
                unassigned: true,
                page: p,
                limit,
                filter: activeFilter,
                search: searchTerm
            })).unwrap();

            if (res) {
                setUnassignedJobs(res.data || []);
                setTotalItems(res.totalCount || 0);
                setTotalPages(res.totalPages || 1);
                if (res.counts) setCounts(res.counts);
            }
        } catch (error) {
            console.error("Error fetching jobs:", error);
        }
    }, [dispatch, limit, activeFilter, searchTerm]);

    useEffect(() => {
        setPage(1);
    }, [searchTerm, activeFilter]);

    useEffect(() => {
        fetchAllJobs(page);
    }, [page, refreshKey, fetchAllJobs]);

    const handleViewClick = (job) => {
        setViewData(job);
        setViewDrawerOpen(true);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">Unassigned Jobs ({totalItems})</h2>
                <div className="flex items-center gap-3">
                    <div
                        onClick={() => { setActiveFilter('qty'); setPage(1); }}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black cursor-pointer transition-all ${counts.qty > 0
                            ? 'bg-violet-600 text-white animate-pulse shadow-lg shadow-violet-200'
                            : 'bg-violet-50 text-violet-400 border border-violet-100'} ${activeFilter === 'qty' ? 'ring-2 ring-offset-1 ring-violet-600' : ''}`}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        QTY ALERT ({counts.qty})
                    </div>
                    <div
                        onClick={() => { setActiveFilter('date'); setPage(1); }}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black cursor-pointer transition-all ${counts.date > 0
                            ? 'bg-orange-500 text-white animate-pulse shadow-lg shadow-orange-200'
                            : 'bg-orange-50 text-orange-400 border border-orange-100'} ${activeFilter === 'date' ? 'ring-2 ring-offset-1 ring-orange-500' : ''}`}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        DATE CHANGE ({counts.date})
                    </div>
                    <div
                        onClick={() => { setActiveFilter('overdue'); setPage(1); }}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-widest cursor-pointer transition-all ${counts.overdue > 0
                            ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200'
                            : 'bg-red-50 text-red-400 border border-red-100'} ${activeFilter === 'overdue' ? 'ring-2 ring-offset-1 ring-red-500' : ''}`}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        OVERDUE ({counts.overdue})
                    </div>
                    {activeFilter !== 'all' && (
                        <button onClick={() => { setActiveFilter('all'); setPage(1); }} className="text-[10px] font-black text-slate-400 hover:text-slate-600 underline tracking-widest">SHOW ALL</button>
                    )}
                    <div className="text-sm font-medium text-slate-400 ml-4">Pending Assignment</div>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-slate-500"
            // style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {(() => {
                    if (unassignedJobs.length === 0) {
                        return (
                            <div className="w-full py-12 flex items-center justify-center text-slate-400 font-medium bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                                {loading ? "Loading..." : activeFilter !== 'all' ? `No jobs match the "${activeFilter}" filter` : "No unassigned jobs found"}
                            </div>
                        );
                    }

                    return unassignedJobs.map((job) => {
                        const urgency = job.opJobCompDate;
                        const isQtyChanged = job.is_qty_changed;
                        const isDateChanged = job.is_date_changed;
                        const hasAlert = isQtyChanged || isDateChanged;

                        return (
                            <div
                                key={job._id}
                                className={`bg-white border border-slate-200 rounded-xl w-[300px] min-w-[300px] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group relative ${isQtyChanged ? 'animate-glow-violet' :
                                    isDateChanged ? 'animate-glow-orange' : ''
                                    }`}
                            >
                                {urgency ? (
                                    <DeliveryPriorityColor
                                        deliveryDate={urgency}
                                        className="w-full h-1.5 rounded-t"
                                        containerStyle={{ width: '100%', height: 'auto', display: 'block' }}
                                    />
                                ) : (
                                    <div className="w-full h-1.5 bg-slate-200 rounded-t" />
                                )}

                                <div className="p-4 pb-2 flex justify-between items-start">
                                    <div className="space-y-0.5 min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[13px] font-black text-slate-700 tracking-tight uppercase">{job.sub_job_no || job.job_no}</span>
                                            {(job.reference_no || job.enquiry_id?.reference_no || job.sales_order_id?.enquiry_id?.reference_no) && (
                                                <span className="text-[12px] font-semibold uppercase tracking-wider mt-[1px]">
                                                    - {job.reference_no || job.enquiry_id?.reference_no || job.sales_order_id?.enquiry_id?.reference_no}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[11px] font-bold text-slate-400 block truncate">{job.client_name || job.sales_order_id?.client_name || 'Retail Client'}</span>
                                    </div>
                                    {urgency ? (
                                        <DeliveryPriorityColor
                                            deliveryDate={urgency}
                                            showPriorityName={true}
                                            className="hidden"
                                        />
                                    ) : (
                                        <span className="text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wider bg-slate-100 text-slate-500">
                                            Normal
                                        </span>
                                    )}
                                </div>

                                <div className="text-center flex flex-col items-center gap-3">
                                    {job.image && (
                                        <div
                                            className="w-8/12 h-32 bg-white rounded-lg border border-slate-100 overflow-hidden shadow-sm relative group/img cursor-zoom-in mt-2"
                                            onClick={() => setLightboxImg(job.image)}
                                        >
                                            <img
                                                src={job.image}
                                                alt=""
                                                className="w-full h-full object-contain p-1"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                                                {/* <span className="text-white text-[10px] font-black uppercase tracking-widest">🔍 Zoom</span> */}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-1 px-4 py-4">
                                    <div className="text-center">
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Qty</div>
                                        <div className="text-sm font-bold text-slate-900">{job.qty || job.job_quantity || job.quantity}</div>
                                    </div>
                                    <div className="text-center border-x border-slate-100">
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Type</div>
                                        <div className="text-sm font-bold text-slate-900 truncate px-1 capitalize">{job.type || 'Prod'}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Due</div>
                                        <div className="text-sm font-bold text-slate-900">{
                                            urgency
                                                ? moment(urgency, ['YYYY-MM-DDTHH:mm', 'DD-MM-YYYY']).format('MMM DD')
                                                : 'N/A'
                                        }</div>
                                    </div>
                                </div>

                                <div className="px-4 pb-4 flex gap-2 mt-auto">
                                    <button
                                        onClick={() => handleViewClick(job)}
                                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-lg transition-colors tracking-widest"
                                    >
                                        VIEW
                                    </button>
                                    <button
                                        onClick={() => onAssignClick(job)}
                                        className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black rounded-lg transition-colors tracking-widest"
                                    >
                                        + ASSIGN
                                    </button>
                                </div>
                            </div>
                        );
                    });
                })()}
            </div>

            <div className="w-full mt-2">
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={(p) => setPage(p)}
                    itemsPerPage={limit}
                    onItemsPerPageChange={(l) => {
                        setLimit(l);
                        setPage(1);
                    }}
                    totalCount={totalItems}
                    startIndex={(page - 1) * limit}
                    visibleItemCount={unassignedJobs.length}
                    customOptions={[8, 16, 24, 32]}
                />
            </div>

            <ImageLightbox
                src={lightboxImg}
                fileName="Job Image"
                onClose={() => setLightboxImg(null)}
            />

            <JobDetailsDrawer
                show={viewDrawerOpen}
                data={viewData}
                onClose={() => setViewDrawerOpen(false)}
                onRefresh={() => fetchAllJobs(page)}
            />

            <style>{`
                @keyframes glow-red {
                    0%, 100% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.2), inset 0 0 5px rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.4); }
                    50% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.6), inset 0 0 10px rgba(239, 68, 68, 0.3); border-color: rgba(239, 68, 68, 0.8); }
                }
                @keyframes glow-violet {
                    0%, 100% { box-shadow: 0 0 5px rgba(139, 92, 246, 0.2), inset 0 0 5px rgba(139, 92, 246, 0.1); border-color: rgba(139, 92, 246, 0.4); }
                    50% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.6), inset 0 0 10px rgba(139, 92, 246, 0.3); border-color: rgba(139, 92, 246, 0.8); }
                }
                @keyframes glow-orange {
                    0%, 100% { box-shadow: 0 0 5px rgba(251, 146, 60, 0.2), inset 0 0 5px rgba(251, 146, 60, 0.1); border-color: rgba(251, 146, 60, 0.4); }
                    50% { box-shadow: 0 0 20px rgba(251, 146, 60, 0.6), inset 0 0 10px rgba(251, 146, 60, 0.3); border-color: rgba(251, 146, 60, 0.8); }
                }
                .animate-glow-red { animation: glow-red 2s infinite ease-in-out; }
                .animate-glow-violet { animation: glow-violet 2s infinite ease-in-out; }
                .animate-glow-orange { animation: glow-orange 2s infinite ease-in-out; }
            `}</style>
        </div>
    );
};

export default UnassignedJobs;