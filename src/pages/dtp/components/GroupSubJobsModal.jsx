import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { fetchDTPGroupById, holdUnholdDTPGroup, fetchAllDTPJobs } from '../../../reducer/dtpStudioReducer';
import HoldModal from '../../components/HoldModal';
import { toast } from 'react-toastify';

const GroupSubJobsModal = ({ isOpen, onClose, groupId, statusFilter, onOpenJobDetails }) => {
    const dispatch = useDispatch();
    const [groupData, setGroupData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const filteredJobs = statusFilter
        ? groupData?.jobs?.filter(job => {
            if (statusFilter === 'Hold') {
                return job.is_on_hold;
            }
            return job.status === statusFilter && !job.is_on_hold;
        })
        : groupData?.jobs;

    const fetchGroupData = useCallback(() => {
        if (groupId) {
            setLoading(true);
            dispatch(fetchDTPGroupById(groupId))
                .unwrap()
                .then(res => {
                    setGroupData(res.data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Failed to fetch group:", err);
                    setLoading(false);
                });
        }
    }, [groupId, dispatch]);

    useEffect(() => {
        if (isOpen) {
            fetchGroupData();
        }
    }, [isOpen, fetchGroupData]);

    const handleGroupHoldConfirm = async (reason) => {
        try {
            setIsProcessing(true);
            await dispatch(holdUnholdDTPGroup({
                id: groupId,
                payload: { is_on_hold: true, hold_reason: reason }
            })).unwrap();
            toast.success("Group put on hold");
            setIsHoldModalOpen(false);
            fetchGroupData();
            dispatch(fetchAllDTPJobs());
        } catch (err) {
            toast.error("Failed to put group on hold");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleGroupUnhold = async () => {
        try {
            setIsProcessing(true);
            await dispatch(holdUnholdDTPGroup({
                id: groupId,
                payload: { is_on_hold: false }
            })).unwrap();
            toast.success("Group released from hold");
            fetchGroupData();
            dispatch(fetchAllDTPJobs());
        } catch (err) {
            toast.error("Failed to unhold group");
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 transition-opacity duration-300 z-[1040] ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                onClick={onClose}
            />

            {/* Panel */}
            <div className={`fixed top-0 right-0 h-full w-[900px] bg-slate-50 shadow-2xl transform transition-transform duration-300 ease-in-out z-[1040] flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Header */}
                <div className="bg-slate-900 text-white p-6 border-b border-slate-700 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-pink-600 flex items-center justify-center shadow-lg shadow-pink-900/20">
                                <i className="fa-solid fa-folder-open text-xl"></i>
                            </div>
                            <div>
                                <div className="text-xl font-black font-primary flex items-center gap-2">
                                    {groupData?.folder_name || 'Loading...'}
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] font-primary">
                                    {statusFilter ? `${statusFilter} Queue` : 'MASTER FOLDER'} • {filteredJobs?.length || 0} ITEMS
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {groupData?.is_on_hold ? (
                                <button
                                    onClick={handleGroupUnhold}
                                    disabled={isProcessing}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/30"
                                >
                                    <i className="fa-solid fa-play"></i> UNHOLD GROUP
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsHoldModalOpen(true)}
                                    disabled={isProcessing}
                                    className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-amber-900/30"
                                >
                                    <i className="fa-solid fa-pause"></i> HOLD GROUP
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors text-slate-400 hover:text-white"
                            >
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sub-Jobs List */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-3xl mx-auto">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.25em] mb-8 font-primary">Current Sub-Jobs Queue</h3>

                        {loading ? (
                            <div className="py-20 text-center">
                                <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                                <p className="text-slate-400 font-bold font-primary text-sm uppercase tracking-widest">Fetching details...</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredJobs?.map((job, index) => (
                                    <div
                                        key={job._id}
                                        onClick={() => onOpenJobDetails(job._id)}
                                        className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-400 transition-all cursor-pointer flex items-center justify-between hover:shadow-xl hover:shadow-indigo-500/5 relative overflow-hidden"
                                    >
                                        {index === 0 && (
                                            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600" />
                                        )}

                                        <div className="flex items-center gap-6">
                                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 font-black text-xs font-primary border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="text-base font-black text-slate-900 font-primary">JOB - {job.sub_job_no}</span>
                                                    {index === 0 && (
                                                        <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-[0.1em] shadow-sm">
                                                            PROCESS NEXT
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs font-bold text-slate-400 font-primary">
                                                    {job.product_name || 'No Description Available'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8">
                                            <div className="text-right">
                                                <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1 font-primary">Current Stage</div>
                                                <div className="text-xs font-bold text-slate-600 font-primary flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    {job.status}
                                                </div>
                                            </div>
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                                <i className="fa-solid fa-arrow-right text-xs"></i>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-white border-t border-slate-200 flex justify-end flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-bold text-sm transition-all shadow-lg font-primary uppercase tracking-widest"
                    >
                        Close Panel
                    </button>
                </div>
            </div>

            <HoldModal
                open={isHoldModalOpen}
                onClose={() => setIsHoldModalOpen(false)}
                onConfirm={handleGroupHoldConfirm}
                loading={isProcessing}
                jobId={groupData?.job_no || 'Group'}
            />
        </>
    );
};

export default GroupSubJobsModal;
