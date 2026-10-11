import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import CloseIcon from "@mui/icons-material/Close";
import { createTeamProductionJob, fetchTeamProductionJobs, reassignTeamProductionJob, acknowledgeDateChange, acknowledgeQtyChange, reallocateTeamProductionJob } from "../../../reducer/assemblyTeamJobReducer";
import { getAllTeams } from "../../../reducer/teamReducer";
import { getAllDepartments } from "../../../reducer/departmentReducer";
import moment from "moment";
import { toast } from "react-toastify";

const AssignProductionModal = ({ open, onClose, onAssigned, job, totalQuantity, reassignmentMode = false }) => {
    const dispatch = useDispatch();
    const { teams } = useSelector(state => state.team);
    const { departments } = useSelector(state => state.department);

    const [selectedTeams, setSelectedTeams] = useState([]);
    const [allocations, setAllocations] = useState({});

    // Form state
    const [note, setNote] = useState("");
    const [dateAlertCleared, setDateAlertCleared] = useState(false);
    const [submitting, setSubmitting] = useState(false);         // for main Confirm/Update button
    const [qtyAckSubmitting, setQtyAckSubmitting] = useState(false);   // for ORDER QTY Accept
    const [dateAckSubmitting, setDateAckSubmitting] = useState(false);  // for DATE Accept
    const [forceFullReallocation, setForceFullReallocation] = useState(false);
    const isSingleTeamReassign = !!job?.team_id;

    // The exact target for this operation:
    // If fixing an order qty change on an existing card, use the remaining order master qty.
    // Otherwise, use this card's exact assigned qty.
    const masterQty = Number(job?.master_qty || job?.current_qty || totalQuantity || 0);
    const thisCardQty = Number(job?.qty || 0);
    const totalAssigned = Number(job?.total_assigned || 0);
    const otherActiveQty = isSingleTeamReassign ? Math.max(0, totalAssigned - thisCardQty) : totalAssigned;
    let targetCardQty;
    if (isSingleTeamReassign) {
        if (job?.is_qty_changed || forceFullReallocation) {
            // Full order reallocation — abandon previous splits and use full master qty
            targetCardQty = masterQty;
        } else {
            // Normal single card reassign — just split this card's qty
            targetCardQty = thisCardQty;
        }
    } else {
        // Placeholder assignment — assign the remaining unassigned qty
        targetCardQty = Math.max(0, masterQty - totalAssigned);
    }

    useEffect(() => {
        if (open) {
            dispatch(getAllDepartments({ is_active: true }));
            dispatch(getAllTeams({ is_active: true }));
            setNote("");
            setDateAlertCleared(false);
            setSubmitting(false);
            setQtyAckSubmitting(false);
            setDateAckSubmitting(false);
            setForceFullReallocation(false);

            if (reassignmentMode && job.production_assignments) {
                const initialSelected = job.production_assignments.map(a => a.team_id?._id || a.team_id);
                const initialAllocations = {};
                job.production_assignments.forEach(a => {
                    const tid = a.team_id?._id || a.team_id;
                    initialAllocations[tid] = {
                        qty: a.allocated_qty || 0,
                        startDateTime: a.start_date_time ? moment(a.start_date_time).format('YYYY-MM-DDTHH:mm') : moment().format('YYYY-MM-DDTHH:mm'),
                        endDateTime: a.end_date_time ? moment(a.end_date_time).format('YYYY-MM-DDTHH:mm') : moment().add(1, 'day').format('YYYY-MM-DDTHH:mm'),
                    };
                });
                setSelectedTeams(initialSelected);
                setAllocations(initialAllocations);
            } else if (isSingleTeamReassign) {
                const oldTeamId = job.team_id?._id || job.team_id;
                setSelectedTeams([oldTeamId]);
                setAllocations({
                    [oldTeamId]: {
                        qty: totalQuantity || job.qty,
                        startDateTime: job.start_date_time ? moment(job.start_date_time).format('YYYY-MM-DDTHH:mm') : moment().format('YYYY-MM-DDTHH:mm'),
                        endDateTime: job.end_date_time ? moment(job.end_date_time).format('YYYY-MM-DDTHH:mm') : moment().add(1, 'day').format('YYYY-MM-DDTHH:mm'),
                    }
                });
            } else {
                setSelectedTeams([]);
                setAllocations({});
            }
        }
    }, [dispatch, open, job, reassignmentMode, isSingleTeamReassign, totalQuantity]);

    const assemblyTeams = teams.filter(t =>
        t.department_id?.name?.toLowerCase().includes("assembly") ||
        t.department_id === departments.find(d => d.name?.toLowerCase().includes("assembly"))?._id
    );

    const handleTeamToggle = (teamId) => {
        if (isSingleTeamReassign) {
            // EDIT MODE: Allow toggling to a different team OR adding more teams to split this card
            if (selectedTeams.includes(teamId)) {
                // Deselect — but always keep at least 1 team selected
                if (selectedTeams.length === 1) return;
                const next = { ...allocations };
                delete next[teamId];
                setSelectedTeams(prev => prev.filter(id => id !== teamId));
                setAllocations(next);
            } else {
                // Add another team — auto-calculate remaining qty gap
                const alreadyAlloc = Object.values(allocations).reduce((s, a) => s + (Number(a.qty) || 0), 0);
                const remaining = Math.max(0, targetCardQty - alreadyAlloc);
                const firstAlloc = Object.values(allocations)[0] || {};
                setSelectedTeams(prev => [...prev, teamId]);
                setAllocations(prev => ({
                    ...prev,
                    [teamId]: {
                        qty: remaining,
                        startDateTime: firstAlloc.startDateTime || (job.start_date_time ? moment(job.start_date_time).format('YYYY-MM-DDTHH:mm') : moment().format('YYYY-MM-DDTHH:mm')),
                        endDateTime: firstAlloc.endDateTime || (job.end_date_time ? moment(job.end_date_time).format('YYYY-MM-DDTHH:mm') : moment().add(1, 'day').format('YYYY-MM-DDTHH:mm')),
                    }
                }));
            }
            return;
        }

        if (selectedTeams.includes(teamId)) {
            setSelectedTeams(prev => prev.filter(id => id !== teamId));
            const newAllocations = { ...allocations };
            delete newAllocations[teamId];
            setAllocations(newAllocations);
        } else {
            const already = Object.values(allocations).reduce((s, a) => s + (Number(a.qty) || 0), 0);
            const remaining = Math.max(0, targetCardQty - already);
            setSelectedTeams(prev => [...prev, teamId]);
            setAllocations(prev => ({
                ...prev,
                [teamId]: {
                    qty: remaining > 0 ? remaining : 0,
                    startDateTime: job?.start_date_time ? moment(job.start_date_time).format('YYYY-MM-DDTHH:mm') : moment().format('YYYY-MM-DDTHH:mm'),
                    endDateTime: job?.end_date_time ? moment(job.end_date_time).format('YYYY-MM-DDTHH:mm') : moment().add(1, 'day').format('YYYY-MM-DDTHH:mm'),
                }
            }));
        }
    };

    const handleAllocationChange = (teamId, field, value) => {
        setAllocations(prev => ({
            ...prev,
            [teamId]: { ...prev[teamId], [field]: value }
        }));
    };

    const handleAssign = async () => {
        // ── MANDATORY QTY CHECK (applies to all paths) ──
        const teamsWithZeroQty = selectedTeams.filter(tid => {
            const q = allocations[tid]?.qty;
            return q === '' || q === undefined || Number(q) <= 0;
        });
        if (teamsWithZeroQty.length > 0) {
            const names = teamsWithZeroQty.map(tid => {
                const t = teams.find(x => x._id === tid);
                return t?.team_name || tid;
            }).join(', ');
            toast.error(`Allocated Units is required for: ${names}`);
            return;
        }

        if (isSingleTeamReassign) {
            if (selectedTeams.length === 0) {
                toast.error("Please select at least one team.");
                return;
            }

            const cardQty = Number(job.qty || 0);
            const deadlineDate = job.opJobCompDate;
            const deadline = deadlineDate ? moment(deadlineDate, 'DD-MM-YYYY').endOf('day') : null;
            const now = moment().subtract(1, 'minutes');

            // Validate dates for every selected team
            for (const tid of selectedTeams) {
                const alloc = allocations[tid] || {};
                const start = alloc.startDateTime ? moment(alloc.startDateTime) : null;
                const end = alloc.endDateTime ? moment(alloc.endDateTime) : null;
                if (start && start.isBefore(now)) { toast.error("Start date cannot be in the past."); return; }
                if (end && end.isBefore(now)) { toast.error("End date cannot be in the past."); return; }
                if (start && end && !end.isAfter(start)) { toast.error("End date must be after start date."); return; }
                if (deadline && end && end.isAfter(deadline) && !deadline.isBefore(now)) {
                    toast.error(`End date cannot be after Job Completion Date (${deadline.format('DD-MM-YYYY')}).`);
                    return;
                }
            }

            const isFullReallocation = job?.is_qty_changed || forceFullReallocation;

            // ── MULTI-TEAM SPLIT or FULL REALLOCATION ──
            if (selectedTeams.length > 1 || isFullReallocation) {
                // Dirty check for full reallocation: compare current allocations vs existing active_assignments
                if (isFullReallocation && job?.active_assignments?.length > 0 && !job?.is_qty_changed) {
                    const existingMap = {};
                    (job.active_assignments || []).forEach(a => {
                        const tid = (a.team_id?._id || a.team_id)?.toString();
                        existingMap[tid] = {
                            qty: Math.round(parseFloat(a.qty || 0)),
                            start: a.start_date_time ? moment(a.start_date_time).format('YYYY-MM-DDTHH:mm') : null,
                            end: a.end_date_time ? moment(a.end_date_time).format('YYYY-MM-DDTHH:mm') : null
                        };
                    });
                    const currentTeamIds = selectedTeams.map(t => t?.toString()).sort();
                    const existingTeamIds = Object.keys(existingMap).sort();
                    const sameTeams = JSON.stringify(currentTeamIds) === JSON.stringify(existingTeamIds);
                    const sameAllocations = sameTeams && selectedTeams.every(tid => {
                        const key = tid?.toString();
                        const ex = existingMap[key];
                        if (!ex) return false;
                        const curQty = Math.round(Number(allocations[tid]?.qty || 0));
                        const curStart = allocations[tid]?.startDateTime || null;
                        const curEnd = allocations[tid]?.endDateTime || null;
                        return ex.qty === curQty && ex.start === curStart && ex.end === curEnd;
                    });
                    if (sameAllocations && note === "") {
                        toast.info("No changes to update.");
                        return;
                    }
                }

                const totalAllocated = Object.values(allocations).reduce((s, a) => s + Number(a.qty || 0), 0);
                if (totalAllocated !== targetCardQty) {
                    toast.error(`Allocated quantities must add up to exactly ${targetCardQty}. (Current total: ${totalAllocated})`);
                    return;
                }
                const production_assignments = selectedTeams.map(tid => ({
                    team_id: tid,
                    allocated_qty: Number(allocations[tid]?.qty || 0),
                    start_date_time: allocations[tid]?.startDateTime,
                    end_date_time: allocations[tid]?.endDateTime
                }));
                if (submitting) return;
                setSubmitting(true);
                try {
                    const res = await dispatch(reallocateTeamProductionJob({
                        sales_order_id: job.sales_order_id?._id || job.sales_order_id,
                        production_assignments,
                        source_job_id: isFullReallocation ? undefined : job._id  // If full reallocation, wipe ALL lanes
                    }));
                    if (reallocateTeamProductionJob.fulfilled.match(res)) {
                        toast.success("Job assignment updated successfully!");
                        dispatch(fetchTeamProductionJobs());
                        if (onAssigned) onAssigned();
                        onClose();
                    } else {
                        toast.error(res.payload?.message || "Reallocation failed.");
                    }
                } catch (err) {
                    toast.error(err?.message || "Reallocation failed. Check console.");
                    console.error("Reallocate error:", err);
                }
                finally { setSubmitting(false); }
                return;
            }

            // ── SINGLE-TEAM reassign / schedule update ──
            const newTeamId = selectedTeams[0];
            const oldTeamId = job.team_id?._id || job.team_id;
            const inputQty = Number(allocations[newTeamId]?.qty || 0);

            // Dirty check
            const oldQty = job.qty || 0;
            const oldStart = job.start_date_time ? moment(job.start_date_time).format('YYYY-MM-DDTHH:mm') : null;
            const oldEnd = job.end_date_time ? moment(job.end_date_time).format('YYYY-MM-DDTHH:mm') : null;
            const newStart = allocations[newTeamId]?.startDateTime || null;
            const newEnd = allocations[newTeamId]?.endDateTime || null;
            const isNoChange = newTeamId === oldTeamId && inputQty === oldQty && newStart === oldStart && newEnd === oldEnd && note === "";
            if (isNoChange) { toast.info("No changes to update."); return; }

            // Quantity validation against master
            const masterQty = Number(job?.master_qty || job?.current_qty || totalQuantity || 0);
            const thisCardQty = Number(job?.qty || 0);  // qty currently assigned to THIS card
            const totalAssigned = Number(job?.total_assigned || thisCardQty); // sum of ALL active cards for this SO
            const otherActiveQty = Math.max(0, totalAssigned - thisCardQty); // qty held by OTHER cards (not this one)

            if (job?.is_qty_changed) {
                // If master qty changed, only enforce inputQty <= masterQty (allow redistribution)
                if (inputQty > masterQty) {
                    toast.error(`Cannot exceed new order target of ${masterQty}.`);
                    return;
                }
            } else {
                if (otherActiveQty > 0) {
                    // Split scenario: this card's new qty + other cards' qty must not exceed master
                    const newTotal = otherActiveQty + inputQty;
                    if (newTotal > masterQty) {
                        toast.error(`Cannot assign ${inputQty} — other team(s) already hold ${otherActiveQty}. Max allowed for this card: ${masterQty - otherActiveQty}.`);
                        return;
                    }
                } else {
                    // Single assignment: must equal master exactly
                    if (inputQty !== masterQty) {
                        toast.error(`Quantity must be exactly ${masterQty}.`);
                        return;
                    }
                }
            }

            if (submitting) return;
            setSubmitting(true);
            try {
                const res = await dispatch(reassignTeamProductionJob({
                    production_job_id: job._id,
                    new_team_id: newTeamId,
                    qty: inputQty,
                    start_date_time: allocations[newTeamId]?.startDateTime,
                    end_date_time: allocations[newTeamId]?.endDateTime,
                    note: note
                }));
                if (reassignTeamProductionJob.fulfilled.match(res)) {
                    toast.success(newTeamId === oldTeamId ? "Schedule updated successfully!" : "Job reassigned successfully!");
                    dispatch(fetchTeamProductionJobs());
                    if (onAssigned) onAssigned();
                    onClose();
                } else {
                    toast.error(res.payload || "Reassignment failed.");
                }
            } catch { toast.error("Reassignment failed."); }
            finally { setSubmitting(false); }
            return;
        }

        const requiredQty = job?.master_qty || job?.current_qty || totalQuantity;
        const totalAllocated = Object.values(allocations).reduce((sum, a) => sum + Number(a.qty), 0);

        if (totalAllocated !== requiredQty) {
            toast.error(`Total quantity must be exactly ${requiredQty}. (Current selection: ${totalAllocated})`);
            return;
        }

        const production_assignments = Object.entries(allocations).map(([teamId, data]) => ({
            team_id: teamId,
            allocated_qty: Number(data.qty),
            start_date_time: data.startDateTime,
            end_date_time: data.endDateTime
        }));

        // Date Validation
        for (const assign of production_assignments) {
            const start = moment(assign.start_date_time);
            const end = moment(assign.end_date_time);
            const now = moment().subtract(1, 'minutes'); // small buffer
            const deadlineDate = job.sales_order_id?.job_completion_datetime || job.job_completion_datetime;
            const deadline = deadlineDate ? moment(deadlineDate, 'DD-MM-YYYY').endOf('day') : null;

            if (start.isBefore(now)) {
                toast.error("Start date and time cannot be in the past.");
                return;
            }
            if (end.isBefore(now)) {
                toast.error("End date and time cannot be in the past.");
                return;
            }
            if (!end.isAfter(start)) {
                toast.error("End date and time must be after start date and time.");
                return;
            }
            if (deadline && end.isAfter(deadline) && !deadline.isBefore(now)) {
                toast.error(`End date (${end.format('DD-MM-YYYY')}) cannot be after Job Completion Date (${deadline.format('DD-MM-YYYY')}).`);
                return;
            }
        }

        if (submitting) return;
        setSubmitting(true);
        try {
            const res = await dispatch(createTeamProductionJob({
                sales_order_id: job.sales_order_id?._id || job.sales_order_id || job._id,
                production_assignments
            }));
            if (createTeamProductionJob.fulfilled.match(res)) {
                toast.success("Job assigned to unit successfully!");
                dispatch(fetchTeamProductionJobs());
                if (onAssigned) onAssigned();  // signal parent to refresh unassigned list
                onClose();
            } else {
                toast.error(res.payload || "Fullfillment error.");
            }
        } catch (error) {
            toast.error("Assignment failed.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-300">
            <div
                className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-slate-100 my-auto"
                style={{ maxWidth: '700px', maxHeight: '80vh' }}
            >
                {/* Alert Banner */}
                {(job?.is_qty_changed || job?.is_date_changed || (job?.is_overdue && !reassignmentMode)) && (
                    <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 space-y-2">
                        {/* Overdue Warning for Unassigned */}
                        {job?.is_overdue && !reassignmentMode && (
                            <div className="flex items-center gap-3 px-3 py-2 bg-red-50 text-red-600 rounded-lg border border-red-100 shadow-sm">
                                <span className="animate-bounce">⚠️</span>
                                <span className="text-[12px] font-black uppercase tracking-tight">Assignment Blocked: Job is Overdue. Please update the completion date first.</span>
                            </div>
                        )}

                        {job?.is_qty_changed && (
                            <div className="flex items-center justify-between px-3 py-2 bg-violet-50 rounded-lg border border-violet-100">
                                <div className="flex items-center gap-3 text-violet-600">
                                    <span className="animate-pulse">📊</span>
                                    <span className="text-[12px] font-black uppercase tracking-wider">
                                        {job.is_order_qty_changed ? "ORDER QTY CHANGED" : "ALLOCATION GAP DETECTED"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-[11px]">
                                    <div className="text-violet-600 text-[11px] uppercase font-bold tracking-tighter bg-white px-2 py-1 rounded border border-violet-100 shadow-sm flex items-center gap-2">
                                        <span className="text-slate-400 font-bold">{job.is_order_qty_changed ? "Target Qty:" : "Required:"}</span>
                                        <span className="font-black text-sm">{job.master_qty}</span>
                                    </div>
                                    {!job.team_id && (
                                        <button
                                            disabled={qtyAckSubmitting}
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (qtyAckSubmitting) return;
                                                setQtyAckSubmitting(true);
                                                try {
                                                    const res = await dispatch(acknowledgeQtyChange({ assembly_job_id: job._id }));
                                                    if (acknowledgeQtyChange.fulfilled.match(res)) {
                                                        toast.success("Quantity change accepted");
                                                        dispatch(fetchTeamProductionJobs()); // Refresh Lanes
                                                        if (onAssigned) onAssigned();        // Refresh Unassigned Pool
                                                        onClose();
                                                    } else {
                                                        toast.error(res.payload?.message || "Failed to acknowledge qty change");
                                                    }
                                                } finally {
                                                    setQtyAckSubmitting(false);
                                                }
                                            }}
                                            className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-black uppercase rounded shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {qtyAckSubmitting ? 'Accepting...' : 'Accept'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                        {job?.is_date_changed && !dateAlertCleared && (
                            <div className="flex items-center justify-between px-3 py-2 bg-orange-50 rounded-lg border border-orange-100">
                                <div className="flex items-center gap-3 text-orange-600">
                                    <span className="animate-pulse">📅</span>
                                    <span className="text-[11px] font-black uppercase tracking-wider">Job Completion Date</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="bg-white px-3 py-1.5 rounded border border-orange-200 shadow-sm flex items-center gap-2">
                                        <span className="text-orange-400 text-[10px] font-black uppercase">Target:</span>
                                        <span className="text-orange-600 font-bold ml-1">{moment(job.current_job_completion_date, ['YYYY-MM-DDTHH:mm', 'DD-MM-YYYY', 'YYYY-MM-DD']).format('DD-MM-YYYY')}</span>
                                    </div>
                                    {/* Overdue Warning for Unassigned - MOVED UP */}
                                    {!job.is_deadline_breached ? (
                                        <button
                                            disabled={dateAckSubmitting}
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (dateAckSubmitting) return;
                                                setDateAckSubmitting(true);
                                                try {
                                                    const res = await dispatch(acknowledgeDateChange({ assembly_job_id: job._id }));
                                                    if (acknowledgeDateChange.fulfilled.match(res)) {
                                                        toast.success("Date change acknowledged");
                                                        dispatch(fetchTeamProductionJobs()); // Refresh Lanes
                                                        if (onAssigned) onAssigned();        // Refresh Unassigned Pool
                                                        setDateAlertCleared(true);
                                                        onClose();
                                                    } else {
                                                        toast.error(res.payload?.message || "Failed to acknowledge date change");
                                                    }
                                                } finally {
                                                    setDateAckSubmitting(false);
                                                }
                                            }}
                                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase rounded shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {dateAckSubmitting ? 'Accepting...' : 'Accept'}
                                        </button>
                                    ) : (
                                        <div className="px-3 py-1.5 bg-red-100 text-red-600 text-[9px] font-black uppercase rounded border border-red-200">
                                            Re-Schedule Required
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
                    <div>
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none">
                            {reassignmentMode ? 'Reassign Job' : 'Assign Production Job'}
                        </h3>
                        <p className="text-[12px] font-black text-slate-400 mt-1 tracking-widest uppercase">
                            {job?.sub_job_no || job?.job_no} | {job?.client_name || job?.sales_order_id?.client_name || 'Retail Client'} | Job Completion Date: <b className="text-red-500">
                                {(() => {
                                    const d = job?.opJobCompDate || job?.job_completion_datetime || job?.current_job_completion_date;
                                    return d ? moment(d, ['YYYY-MM-DDTHH:mm', 'DD-MM-YYYY']).format('DD-MM-YYYY HH:mm') : '-';
                                })()}
                            </b>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400 hover:text-slate-800 flex-shrink-0"
                    >
                        <CloseIcon fontSize="small" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 min-h-0 scrollbar-thin scrollbar-thumb-gray-300">
                    {/* Full Reallocation Banner */}
                    {job?.active_assignments?.length >= 1 && (
                        <div>
                            <div>
                                {job?.active_assignments && job.active_assignments.length >= 1 && (
                                    <button
                                        onClick={() => {
                                            const newAlloc = {};
                                            job.active_assignments.forEach(a => {
                                                const tid = a.team_id?._id || a.team_id;
                                                const qty = Number(a.qty || 0);
                                                if (newAlloc[tid]) {
                                                    newAlloc[tid].qty += qty;
                                                    // Keep earliest start and latest end date if possible
                                                    if (a.start_date_time && moment(a.start_date_time).isBefore(newAlloc[tid].startDateTime)) {
                                                        newAlloc[tid].startDateTime = moment(a.start_date_time).format('YYYY-MM-DDTHH:mm');
                                                    }
                                                    if (a.end_date_time && moment(a.end_date_time).isAfter(newAlloc[tid].endDateTime)) {
                                                        newAlloc[tid].endDateTime = moment(a.end_date_time).format('YYYY-MM-DDTHH:mm');
                                                    }
                                                } else {
                                                    newAlloc[tid] = {
                                                        qty: qty,
                                                        startDateTime: a.start_date_time ? moment(a.start_date_time).format('YYYY-MM-DDTHH:mm') : moment().format('YYYY-MM-DDTHH:mm'),
                                                        endDateTime: a.end_date_time ? moment(a.end_date_time).format('YYYY-MM-DDTHH:mm') : moment().add(1, 'day').format('YYYY-MM-DDTHH:mm')
                                                    };
                                                }
                                            });
                                            setSelectedTeams(Object.keys(newAlloc));
                                            setAllocations(newAlloc);
                                            setForceFullReallocation(true);
                                        }}
                                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider rounded transition-colors shadow-sm flex items-center gap-1.5"
                                    >
                                        <span>🔄</span> Load All Currently Assigned Teams ({job.active_assignments.length})
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                    {/* Team Selection */}
                    <div className="space-y-3">
                        <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest px-1">Select Production Unit</label>
                        <div className="grid grid-cols-2 gap-3">
                            {assemblyTeams.map(t => (
                                <div
                                    key={t._id}
                                    onClick={() => handleTeamToggle(t._id)}
                                    className={`relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${selectedTeams.includes(t._id)
                                        ? 'bg-indigo-50 border-indigo-600 shadow-lg shadow-indigo-100/50'
                                        : 'bg-slate-50 border-transparent hover:border-slate-200'
                                        }`}
                                >
                                    <div
                                        className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl"
                                        style={{ backgroundColor: t.color || '#cbd5e1' }}
                                    />
                                    <h4 className={`text-[14px] font-black mb-1 transition-colors truncate ${selectedTeams.includes(t._id) ? 'text-indigo-600' : 'text-slate-800'
                                        }`}>
                                        {t.team_name}
                                    </h4>
                                    <div className="flex flex-col gap-0.5">
                                        <div className="text-[11px] font-black text-slate-500 uppercase tracking-wider truncate">
                                            {t.shift_timing?.name || 'Day Shift'}
                                        </div>
                                        <div className="text-[12px] font-bold text-slate-700 tracking-tight">
                                            {t.shift_timing?.start_time} - {t.shift_timing?.end_time}
                                        </div>
                                        {/* <div className="flex items-center gap-1 mt-1">
                                            <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                                                {t.member_list?.length || 0} Members
                                            </span>
                                        </div> */}
                                        <div className="flex items-center gap-1 mt-1">
                                            <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                                                {t.member_list?.length || 0} Members
                                            </span>
                                        </div>

                                        {t.member_list?.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {t.member_list.map(member => (
                                                    <span
                                                        key={member._id}
                                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${selectedTeams.includes(t._id)
                                                            ? 'bg-indigo-200 text-indigo-800'
                                                            : 'bg-slate-200 text-slate-600'
                                                            }`}
                                                    >
                                                        {member.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Allocation Details */}
                    <div className="space-y-4">
                        {selectedTeams.map(tid => {
                            const teamItem = teams.find(t => t._id === tid);
                            const alloc = allocations[tid] || {};
                            return (
                                <div
                                    key={tid}
                                    className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-5 animate-in slide-in-from-top-2 duration-300"
                                >
                                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                        <span className="text-[12px] font-black text-indigo-600 uppercase tracking-widest truncate">
                                            {teamItem?.team_name} Configuration
                                        </span>
                                        <span className="text-[12px] font-black text-slate-400 font-bold uppercase tracking-widest bg-white px-2 py-1 rounded-md border border-slate-100 flex-shrink-0 ml-2 shadow-sm">
                                            {job?.is_qty_changed ? (
                                                <>Target: <b className="text-violet-600">{job.master_qty}</b> <span className="mx-1 opacity-20">|</span> Assigned: <b className={job.total_assigned === job.master_qty ? "text-emerald-500" : "text-amber-500"}>{job.total_assigned}</b></>
                                            ) : (
                                                <>{(job?.master_qty || job?.current_qty || totalQuantity)} Units required</>
                                            )}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Start Date & Time</label>
                                            <input
                                                type="datetime-local"
                                                value={alloc.startDateTime || ''}
                                                min={new Date().toISOString().slice(0, 16)}
                                                onChange={(e) => handleAllocationChange(tid, 'startDateTime', e.target.value)}
                                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[14px] font-black text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">End Date & Time</label>
                                            <input
                                                type="datetime-local"
                                                value={alloc.endDateTime || ''}
                                                min={alloc.startDateTime || new Date().toISOString().slice(0, 16)}
                                                onChange={(e) => handleAllocationChange(tid, 'endDateTime', e.target.value)}
                                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[14px] font-black text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center px-1">
                                            <label className={`text-[10px] font-black uppercase tracking-widest ${Number(alloc.qty) <= 0 || alloc.qty === '' || alloc.qty === undefined ? 'text-red-500' : 'text-slate-500'}`}>
                                                Allocated Units {(Number(alloc.qty) <= 0 || alloc.qty === '' || alloc.qty === undefined) && <span className="normal-case font-bold">— required</span>}
                                            </label>
                                            {(() => {
                                                const alreadyOthers = selectedTeams
                                                    .filter(t => t !== tid)
                                                    .reduce((s, t) => s + Number(allocations[t]?.qty || 0), 0);
                                                const maxForThis = Math.max(0, targetCardQty - alreadyOthers);
                                                return (
                                                    <span className="text-[11px] font-bold text-slate-400">
                                                        Max: <b className="text-indigo-500">{maxForThis}</b>
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                        <input
                                            type="number"
                                            min="1"
                                            value={alloc.qty === undefined || alloc.qty === '' ? '' : alloc.qty}
                                            onChange={(e) => handleAllocationChange(tid, 'qty', e.target.value === '' ? '' : Number(e.target.value))}
                                            className={`w-full px-3 py-2.5 rounded-xl text-[14px] font-black outline-none transition-all shadow-sm border ${Number(alloc.qty) <= 0 || alloc.qty === '' || alloc.qty === undefined
                                                ? 'bg-red-50 border-red-300 text-red-700 focus:ring-2 focus:ring-red-400'
                                                : 'bg-white border-slate-200 text-slate-700 focus:ring-2 focus:ring-indigo-500'
                                                }`}
                                            placeholder="Enter quantity"
                                        />
                                    </div>
                                </div>
                            );
                        })}

                        {selectedTeams.length === 0 && (
                            <div className="py-12 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-300">
                                <span className="text-[10px] font-black uppercase tracking-widest">No team selected</span>
                            </div>
                        )}

                        {/* Handover note: only for single-team reassign to a DIFFERENT team */}
                        {isSingleTeamReassign && selectedTeams.length === 1 && selectedTeams[0] !== (job.team_id?._id || job.team_id) && (
                            <div className="p-5 border border-amber-100 rounded-2xl bg-amber-50/30 space-y-3 animate-in fade-in duration-300 shadow-sm">
                                <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest px-1 flex items-center gap-1.5">
                                    <span>✍️</span> Handover Instruction / Note
                                </label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Provide context for the new team taking over..."
                                    className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-amber-500 transition-all shadow-sm min-h-[80px] resize-none"
                                />
                            </div>
                        )}

                    </div>
                </div>

                {/* Footer — fixed, never overflows */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 rounded-xl font-black text-xs tracking-widest transition-all uppercase whitespace-nowrap"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAssign}
                            disabled={selectedTeams.length === 0 || submitting || (job?.is_overdue && !reassignmentMode)}
                            className="flex-1 py-3 bg-emerald-500 hover:bg-slate-800 text-white rounded-xl font-black text-xs tracking-widest shadow-lg shadow-emerald-100 transition-all disabled:opacity-50 disabled:shadow-none uppercase whitespace-nowrap flex items-center justify-center gap-2"
                        >
                            {submitting && (
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {submitting ? 'Processing...' : (job?.is_overdue && !reassignmentMode ? 'Re-Schedule Required' : (reassignmentMode ? 'Update Assignment' : 'Confirm Assignment'))}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignProductionModal;