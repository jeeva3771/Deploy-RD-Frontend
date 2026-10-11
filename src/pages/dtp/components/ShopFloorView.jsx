import React, { useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
// import moment from 'moment';
import JobDetailsPanel from './JobDetailsPanel';
import DeliveryPriorityColor from '../../../components/deliveryPriorityColor/priorityColor';
import ShopFloorFilesPanel from './ShopFloorFilesPanel';
import ShopFloorJobCard from './ShopFloorJobCard';
import { clearDTPChangeFlag } from '../../../reducer/dtpStudioReducer';

const ShopFloorView = ({ jobs, onOpenDetails, currentUser, userRole }) => {
    const dispatch = useDispatch();

    const handleJobClick = (id, sectionId, processIndex) => {
        if (onOpenDetails) {
            onOpenDetails(id);
        }
    };

    // Process jobs to group by unique processes found in their materialprocess lists
    const processGroups = useMemo(() => {
        const groups = {};

        // Helper to add job to a group
        const addToGroup = (columnName, job, status, sectionName, sectionId, processIndex, actualProcessName) => {
            const normalizedName = columnName.toUpperCase();
            if (!groups[normalizedName]) {
                groups[normalizedName] = {
                    name: columnName,
                    jobs: []
                };
            }
            // Allow duplicates for different sections/indices if same job has multiple processes
            groups[normalizedName].jobs.push({ job, status, sectionName, sectionId, processIndex, actualProcessName });
        };

        if (jobs && jobs.length > 0) {
            const isArtistView = userRole?.toLowerCase() !== 'admin executive' &&
                !currentUser?.is_head &&
                (currentUser?.role?.name?.toLowerCase() === 'design executive' ||
                    currentUser?.role?.toLowerCase() === 'design executive' ||
                    currentUser?.role?.name?.toLowerCase() === '3d design executive' ||
                    currentUser?.role?.toLowerCase() === '3d design executive' ||
                    userRole === 'dtp operator');

            let filteredJobs = [...jobs];

            if (isArtistView) {
                filteredJobs = filteredJobs.filter(job => {
                    const isAssigned = (job.assigned_to === currentUser?._id || job.assigned_to?._id === currentUser?._id);
                    const jobCreatedBy = typeof job.created_by === 'object' ? job.created_by?._id : job.created_by;
                    return isAssigned || jobCreatedBy === currentUser?._id;
                });
            }

            filteredJobs.forEach(job => {
                if (job.job_sheet && job.job_sheet.materialprocess) {
                    job.job_sheet.materialprocess.forEach((mp, mpIdx) => {
                        if (mp.processes && mp.processes.length > 0) {
                            mp.processes.forEach((proc, procIdx) => {
                                if (proc.process_name) {
                                    const processIndex = `${mpIdx + 1}.${procIdx + 1}`;
                                    const procStatus = proc.status || 'Pending';

                                    let groupName;
                                    // If job reached Shop Floor stage, collect in specialized grouping
                                    if (job.status === 'Shop Floor') {
                                        groupName = 'SHOP FLOOR (COMPLETED)';
                                    } else {
                                        groupName = proc.process_name.toUpperCase();
                                    }

                                    addToGroup(
                                        groupName,
                                        job,
                                        procStatus,
                                        mp.material_group_name,
                                        mp.material_group_id,
                                        processIndex,
                                        proc.process_name
                                    );
                                }
                            });
                        }
                    });
                }
            });
        }

        // Sort groups: Virtual Shop Floor groups first, then priorities, then alphabetical
        return Object.values(groups).sort((a, b) => {
            const nameA = a.name.toUpperCase();
            const nameB = b.name.toUpperCase();

            // Virtual Shop Floor grouping priority
            const isSF_A = nameA === 'SHOP FLOOR';
            const isSFC_A = nameA === 'SHOP FLOOR (COMPLETED)';
            const isSF_B = nameB === 'SHOP FLOOR';
            const isSFC_B = nameB === 'SHOP FLOOR (COMPLETED)';

            if (isSF_A) return 1;
            if (isSF_B) return -1;
            if (isSFC_A) return 1;
            if (isSFC_B) return -1;

            // Priority logic for other groups
            const isLaserA = nameA.includes('LASER');
            const isUvA = nameA.includes('UV');
            const isLaserB = nameB.includes('LASER');
            const isUvB = nameB.includes('UV');

            const isPriorityA = isLaserA || isUvA;
            const isPriorityB = isLaserB || isUvB;

            if (isPriorityA === isPriorityB) {
                if (isPriorityA) {
                    if (isLaserA && !isLaserB) return -1;
                    if (!isLaserA && isLaserB) return 1;
                }
                return nameA.localeCompare(nameB);
            }

            return isPriorityA ? -1 : 1;
        });
    }, [jobs, currentUser, userRole]);

    return (
        <div className="h-full overflow-y-auto bg-slate-50 p-4 relative scrollbar-thin">
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 transition-all duration-300`}>
                {processGroups.length > 0 ? (
                    processGroups.map(group => (
                        <div key={group.name} className="flex flex-col h-[500px] rounded-lg shadow-sm border border-slate-200 bg-white">
                            {/* Column Header */}
                            <div className="bg-slate-900 text-white p-3 rounded-t-lg flex justify-between items-center shadow-sm shrink-0">
                                <span className="font-bold text-sm tracking-wide truncate" title={group.name}>
                                    {group.name}
                                </span>
                                <span className="bg-slate-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                    {group.jobs.length}
                                </span>
                            </div>

                            {/* Column Body */}
                            <div className="bg-slate-100 border-x border-b border-slate-200 rounded-b-lg p-2 flex-1 overflow-y-auto custom-scrollbar">
                                {group.jobs.map(({ job, status, sectionName, sectionId, processIndex, actualProcessName }) => (
                                    <ShopFloorJobCard
                                        key={`${job._id}-${group.name}-${sectionName}-${processIndex}`}
                                        job={job}
                                        processStatus={status}
                                        sectionName={sectionName}
                                        sectionId={sectionId}
                                        processIndex={processIndex}
                                        onOpenDetails={handleJobClick}
                                        processName={actualProcessName}
                                        isShopFloorGroup={group.name === 'SHOP FLOOR (COMPLETED)'}
                                    />
                                ))}

                                {group.jobs.length === 0 && (
                                    <div className="text-center text-slate-400 py-10 text-sm italic">
                                        No Active Jobs
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full h-96 flex items-center justify-center text-slate-400">
                        <div className="text-center">
                            <i className="fa-solid fa-layer-group text-4xl mb-4"></i>
                            <p className="text-lg font-medium">No processes found in active jobs.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Replaced Job Details Panel with Files Panel for Shop Floor */}
            {/* <ShopFloorFilesPanel
                job={selectedJob}
                sectionId={selectedSectionId}
                processIndex={selectedProcessIndex}
                isOpen={isDetailsPanelOpen}
                onClose={handleCloseDetails}
            /> */}

        </div>
    );
};

export default ShopFloorView;
