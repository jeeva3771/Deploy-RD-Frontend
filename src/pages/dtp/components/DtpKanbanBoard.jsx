import React, { useState, useEffect } from 'react';
import DtpJobCard from './DtpJobCard';
import DtpGroupCard from './DtpGroupCard';
import JobDetailsPanel from './JobDetailsPanel';
import GroupJobsModal from './GroupJobsModal';
import GroupSubJobsModal from './GroupSubJobsModal';
import HoldModal from '../../components/HoldModal';
import UnholdModal from '../../components/UnholdModal';
import { useDispatch } from 'react-redux';
import { createDTPJobGroup, fetchAllDTPJobs, holdUnholdDTPJob, clearDTPChangeFlag } from '../../../reducer/dtpStudioReducer';
import { toast } from 'react-toastify';

const DtpKanbanBoard = ({ selectedUser, newJobs: jobs, currentUser, userRole, onOpenDetails }) => {
    // Determine if user should have limited artist view
    const isArtistView = userRole?.toLowerCase() !== 'admin executive' &&
        !currentUser?.is_head &&
        (
            currentUser?.role?.name?.toLowerCase() === 'dtp operator' ||
            currentUser?.role?.toLowerCase() === 'dtp operator'
        )

    // Initial State with all columns
    const [columns, setColumns] = useState({
        onHold: {
            id: 'onHold',
            title: 'ON HOLD',
            className: 'on-hold',
            items: []
        },
        newJobs: {
            id: 'newJobs',
            title: 'NEW JOBS',
            className: 'new-jobs',
            items: [] // Will be populated via useEffect
        },
        assigned: {
            id: 'assigned',
            title: 'ASSIGNED',
            className: 'assigned',
            items: []
        },
        masterTemplate: {
            id: 'masterTemplate',
            title: 'MASTER TEMPLATE',
            className: 'master-template',
            items: []
        },
        contentProofing: {
            id: 'contentProofing',
            title: 'CONTENT PROOFING',
            className: 'content-proofing',
            items: []
        },
        finalPrep: {
            id: 'finalPrep',
            title: 'FINAL PREP',
            className: 'final-prep',
            items: []
        },
        shopFloor: {
            id: 'shopFloor',
            title: 'SHOP FLOOR',
            className: 'shop-floor',
            items: []
        },
        reprocess: {
            id: 'reprocess',
            title: 'REPROCESS',
            className: 'reprocess',
            items: []
        }
    });

    useEffect(() => {
        if (jobs) {
            // Identify groups based on ID and Status (to allow multi-presence)
            const ungroupedJobs = [];
            const groupMap = {};

            jobs.forEach(job => {
                const groupId = typeof job.group_id === 'object' ? job.group_id?._id : job.group_id;
                if (groupId) {
                    const status = job.is_on_hold ? 'Hold' : job.status;
                    const groupKey = `${groupId}_${status}`;
                    if (!groupMap[groupKey]) {
                        groupMap[groupKey] = {
                            id: groupId,
                            key: groupKey,
                            isGroup: true,
                            is_on_hold: (status === 'Hold'),
                            folder_name: (typeof job.group_id === 'object' ? job.group_id?.folder_name : null) || 'Group',
                            status: status,
                            job_no: job.job_no,
                            enquiry_id: job.enquiry_id,
                            assigned_to: job.assigned_to,
                            assigned_to_name: job.assigned_to_name,
                            jobs: []
                        };
                    }
                    groupMap[groupKey].jobs.push(job);
                } else {
                    ungroupedJobs.push(job);
                }
            });

            const processedItems = [
                ...ungroupedJobs,
                ...Object.values(groupMap)
            ];

            // Map jobs/groups to the required format
            const mapItemToColumnData = (item) => {
                if (item.isGroup) {
                    return {
                        ...item,
                        id: item.id, // Actual Mongo ID for fetching
                        renderKey: item.key, // Unique key for Kanban rendering
                        clientName: item.folder_name,
                        batchName: `${item.jobs.length} Jobs`,
                        assignedTo: item.assigned_to,
                        priority: 'Normal'
                    };
                }

                return {
                    id: item._id || item.id,
                    jobId: item.sub_job_no,
                    clientName: item.client_name || 'Unknown Client',
                    batchName: item.product_name,
                    assignedTo: item.assigned_to ? `${item.assigned_to}` : null,
                    priority: item.process_priority?.some(p => (typeof p === 'string' ? p : p.type)?.toLowerCase() === 'critical') ? 'Critical' : 'Normal',
                    ...item
                };
            };

            const onHoldItems = processedItems.filter(item => item.is_on_hold || item.status === 'Hold');
            const otherItems = processedItems.filter(item => !item.is_on_hold && item.status !== 'Hold');

            const getByStatus = (status) => otherItems.filter(item => item.status === status);

            setColumns(prev => ({
                ...prev,
                onHold: { ...prev.onHold, items: onHoldItems.map(mapItemToColumnData) },
                newJobs: { ...prev.newJobs, items: getByStatus('Pending').map(mapItemToColumnData) },
                assigned: { ...prev.assigned, items: getByStatus('Assigned').map(mapItemToColumnData) },
                masterTemplate: { ...prev.masterTemplate, items: getByStatus('Master Template').map(mapItemToColumnData) },
                contentProofing: { ...prev.contentProofing, items: getByStatus('Content Proofing').map(mapItemToColumnData) },
                finalPrep: { ...prev.finalPrep, items: otherItems.filter(item => item.status === 'Final Prep' || item.status === 'Accounting Quantity' || item.status === 'Push to Floor').map(mapItemToColumnData) },
                shopFloor: { ...prev.shopFloor, items: getByStatus('Shop Floor').map(mapItemToColumnData) },
                reprocess: { ...prev.reprocess, items: getByStatus('Reprocess').map(mapItemToColumnData) },
            }));
        }
    }, [jobs]);

    // Column Color Mapping
    const columnColors = {
        onHold: 'border-red-400',
        newJobs: 'border-slate-300',
        assigned: 'border-pink-500',
        masterTemplate: 'border-indigo-600',
        contentProofing: 'border-cyan-600',
        finalPrep: 'border-slate-600',
        shopFloor: 'border-emerald-600',
        reprocess: 'border-orange-500'
    };

    const getFilteredItems = (items) => {
        if (!items || items.length === 0) return [];

        // If user is an artist (non-head), they only see their own jobs
        if (isArtistView) {
            return items.filter(item => {
                const assignedId = typeof item.assigned_to === 'object' ? item.assigned_to?._id : item.assigned_to;
                return assignedId === currentUser?._id;
            });
        }

        // Admin/Head View:
        // If "All Artists" is selected (selectedUser is null), show all jobs
        if (!selectedUser) return items;

        // If a specific user is selected, filter by assignedTo matching the user's ID
        return items.filter(item => {
            const assignedId = typeof item.assigned_to === 'object' ? item.assigned_to?._id : item.assigned_to;
            return assignedId === selectedUser._id;
        });
    };

    const [openToHistory, setOpenToHistory] = useState(false);
    const [selectedJobs, setSelectedJobs] = useState([]);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState(null);
    const [selectedGroupStatus, setSelectedGroupStatus] = useState(null);
    const [isGroupSubJobsOpen, setIsGroupSubJobsOpen] = useState(false);
    const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
    const [holdJobId, setHoldJobId] = useState(null);
    const [isUnholdModalOpen, setIsUnholdModalOpen] = useState(false);
    const [unholdJobId, setUnholdJobId] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const dispatch = useDispatch();

    const handleSelectJob = (job) => {
        // Enforce grouping constraints: same job_no and enquiry_id
        if (selectedJobs.length > 0) {
            const firstJob = selectedJobs[0];
            if (job.job_no !== firstJob.job_no || job.enquiry_id?._id !== firstJob.enquiry_id?._id) {
                toast.error("Only sub-jobs of the same parent job can be grouped");
                return;
            }
        }

        setSelectedJobs(prev => {
            const isAlreadySelected = prev.some(j => j._id === job._id);
            if (isAlreadySelected) {
                return prev.filter(j => j._id !== job._id);
            } else {
                return [...prev, job];
            }
        });
    };

    const handleGroupConfirm = async (groupData) => {
        try {
            await dispatch(createDTPJobGroup({
                ...groupData,
                job_ids: selectedJobs.map(j => j._id)
            })).unwrap();

            toast.success("Jobs grouped successfully!");
            setIsGroupModalOpen(false);
            setSelectedJobs([]);
            dispatch(fetchAllDTPJobs());
        } catch (error) {
            console.error("Grouping error:", error);
            toast.error(error.message || "Failed to group jobs");
        }
    };

    const handleHoldClick = (jobId) => {
        setHoldJobId(jobId);
        setIsHoldModalOpen(true);
    };

    const handleHoldConfirm = async (reason) => {
        if (!holdJobId) return;
        try {
            setIsProcessing(true);
            await dispatch(holdUnholdDTPJob({
                id: holdJobId,
                payload: { is_on_hold: true, hold_reason: reason }
            })).unwrap();
            toast.success("Job put on hold");
            setIsHoldModalOpen(false);
            setHoldJobId(null);
            dispatch(fetchAllDTPJobs());
        } catch (err) {
            console.error("Hold error:", err);
            toast.error("Failed to put job on hold");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUnholdClick = (jobId) => {
        setUnholdJobId(jobId);
        setIsUnholdModalOpen(true);
    };

    const handleUnholdConfirm = async (data) => {
        if (!unholdJobId) return;
        try {
            setIsProcessing(true);
            await dispatch(holdUnholdDTPJob({
                id: unholdJobId,
                payload: {
                    is_on_hold: false,
                    ...data
                }
            })).unwrap();
            toast.success("Job Released from Hold");
            setIsUnholdModalOpen(false);
            setUnholdJobId(null);
            dispatch(fetchAllDTPJobs());
        } catch (err) {
            console.error("Unhold error:", err);
            toast.error("Failed to unhold job");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleOpenDetails = (id, history = false, isGroup = false, status = null) => {
        if (isGroup) {
            setSelectedGroupId(id);
            setSelectedGroupStatus(status);
            setIsGroupSubJobsOpen(true);
        } else {
            if (onOpenDetails) {
                onOpenDetails(id, history);
            }
        }
    };

    const handleBackToFolder = (groupId) => {
        // Find the job to get its current status for the folder filter
        // If we want to go back to group modal from a lifted panel, we'll need a prop for onClose or similar
        // For now, let's just make it open the group modal
        setSelectedGroupId(groupId);
        setIsGroupSubJobsOpen(true);
    };

    return (
        <div className="flex-1 overflow-x-auto p-6 flex gap-6 items-stretch relative bg-slate-50 h-full scrollbar-thin scrollbar-thumb-slate-500 scrollbar-track-slate-100 scroll-auto snap-x snap-mandatory">
            {Object.values(columns)
                .filter(column => !(isArtistView && column.id === 'newJobs'))
                .map(column => {
                    const filteredItems = getFilteredItems(column.items);
                    const borderColor = columnColors[column.id] || 'border-slate-200';

                    return (
                        <div key={column.id} className={`min-w-[340px] w-[340px] flex flex-col h-full rounded-xl border-t-4 ${borderColor} bg-white shadow-sm flex-shrink-0 snap-center`}>
                            <div className="p-4 border-b border-slate-100 font-bold text-sm uppercase text-slate-700 flex justify-between items-center">
                                {column.title}
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-500 font-bold">
                                    {filteredItems.length}
                                </span>
                            </div>
                            <div className="p-4 flex-1 overflow-y-auto min-h-0 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50 scroll-auto">
                                {filteredItems.map(item => (
                                    item.isGroup ? (
                                        <DtpGroupCard
                                            key={item.renderKey}
                                            group={item}
                                            columnType={column.title}
                                            onOpenDetails={handleOpenDetails}
                                        />
                                    ) : (
                                        <DtpJobCard
                                            key={item.id}
                                            job={item}
                                            columnType={column.id === 'newJobs' ? 'NEW JOBS' : column.title}
                                            onOpenDetails={handleOpenDetails}
                                            isSelected={selectedJobs.some(j => j._id === item._id)}
                                            onSelect={column.id === 'newJobs' ? handleSelectJob : null}
                                            onHold={handleHoldClick}
                                            onUnhold={handleUnholdClick}
                                        />
                                    )
                                ))}
                                {filteredItems.length === 0 && (
                                    <div className="text-slate-400 text-center text-xs py-8 italic">No jobs found</div>
                                )}
                            </div>
                        </div>
                    );
                })}

            {/* Selection Bar */}
            {selectedJobs.length > 0 && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-[#1e293b] text-white px-5 py-2.5 rounded-xl shadow-2xl z-[1050] flex items-center gap-6 border border-slate-700/50 backdrop-blur-sm">
                    <div className="text-sm font-bold font-primary whitespace-nowrap">
                        {selectedJobs.length} Selected
                    </div>

                    <button
                        onClick={() => {
                            if (selectedJobs.length < 2) {
                                toast.error("At least 2 jobs are required to create a group");
                                return;
                            }
                            setIsGroupModalOpen(true);
                        }}
                        className="bg-[#d2145a] hover:bg-[#b0104a] text-white px-6 py-2 rounded-lg font-bold text-sm transition-all shadow-lg active:scale-95 font-primary"
                    >
                        Group
                    </button>

                    <button
                        onClick={() => setSelectedJobs([])}
                        className="text-slate-400 hover:text-white transition-colors ml-2"
                        title="Clear selection"
                    >
                        <i className="fa-solid fa-times text-xs"></i>
                    </button>
                </div>
            )}

            {/* <JobDetailsPanel
                job={selectedJob}
                isOpen={isDetailsPanelOpen}
                onClose={handleCloseDetails}
                initialShowHistory={openToHistory}
                onBackToFolder={handleBackToFolder}
                currentUser={currentUser}
                userRole={userRole}
            /> */}

            <GroupJobsModal
                isOpen={isGroupModalOpen}
                onClose={() => setIsGroupModalOpen(false)}
                selectedJobs={selectedJobs}
                onConfirm={handleGroupConfirm}
            />

            <GroupSubJobsModal
                isOpen={isGroupSubJobsOpen}
                onClose={() => {
                    setIsGroupSubJobsOpen(false);
                    setSelectedGroupStatus(null);
                }}
                groupId={selectedGroupId}
                statusFilter={selectedGroupStatus}
                onOpenJobDetails={(jobId) => {
                    setIsGroupSubJobsOpen(false);
                    handleOpenDetails(jobId);
                }}
            />

            <HoldModal
                open={isHoldModalOpen}
                onClose={() => setIsHoldModalOpen(false)}
                onConfirm={handleHoldConfirm}
                loading={isProcessing}
                jobId={jobs?.find(j => (j._id || j.id) === holdJobId)?.sub_job_no || 'Job'}
            />

            <UnholdModal
                open={isUnholdModalOpen}
                onClose={() => setIsUnholdModalOpen(false)}
                onConfirm={handleUnholdConfirm}
                loading={isProcessing}
                jobId={jobs?.find(j => (j._id || j.id) === unholdJobId)?.sub_job_no}
                currentDate={jobs?.find(j => (j._id || j.id) === unholdJobId)?.delivery_date}
                currentJobCompletionDate={jobs?.find(j => (j._id || j.id) === unholdJobId)?.job_completion_date}
                type="dtp"
            />
        </div>
    );
};

export default DtpKanbanBoard;
