import React, { useRef, useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllBOMs } from "../../../reducer/bomReducer";
import { acknowledgeDateChange, fetchTeamProductionJobs, acknowledgeQtyChange, acknowledgeNotHeadAlert } from "../../../reducer/assemblyTeamJobReducer";
import { toast } from "react-toastify";
import JobDetailsPopup from "../../salesorder/components/JobDetailsPopup";
import moment from "moment";

const JobDetailsDrawer = ({ show, onClose, data, onRefresh }) => {
    const dispatch = useDispatch();
    const { boms, loading } = useSelector(state => state.bom);
    const [showJobDetailsPopup, setShowJobDetailsPopup] = useState(false);

    // Fetch BOMs when drawer opens with job_no and sub_job_no
    useEffect(() => {
        if (show && data) {
            const params = {};

            if (data.job_no) {
                params.job_no = data.job_no;
            }

            if (data.sub_job_no) {
                params.sub_job_no = data.sub_job_no;
            }

            // Only fetch if we have at least one search parameter
            if (params.job_no || params.sub_job_no) {
                dispatch(fetchAllBOMs(params));
            }
        }
    }, [show, data, dispatch]);

    // Group job sheet processes by department
    const groupedProcessesByDepartment = useMemo(() => {
        if (!boms || boms.length === 0) return {};

        const bomData = boms[0];
        const materialProcesses = bomData?.materialprocess || [];

        const grouped = {};

        materialProcesses.forEach((materialGroup) => {
            const processes = materialGroup.processes || [];

            processes.forEach((process) => {
                const department = process.department || "Uncategorized";

                if (!grouped[department]) {
                    grouped[department] = [];
                }

                grouped[department].push({
                    ...process,
                    material_group_id: materialGroup.material_group_id,
                    material_group_name: materialGroup.material_group_name,
                    material_total: materialGroup.material_total,
                    material_unit: materialGroup.material_unit,
                    material_input: materialGroup.material_input,
                });
            });
        });

        return grouped;
    }, [boms]);

    // Permission logic for history
    const user = useSelector(state => state.auth.user);
    const role = user?.role?.toLowerCase() || '';
    const isAdmin = role === 'admin executive';
    const isOperatingDirector = role.includes('operation');
    const isAssemblyHead = role.includes('assembly') && !!user?.is_head;
    const isAssemblyNotHead = role.includes('assembly') && !user?.is_head;
    const canViewHistory = isAdmin || isOperatingDirector || isAssemblyHead;

    if (!show || !data) return null;

    // Use BOM data from Redux store if available, otherwise fall back to prop data
    const currentBomData = boms && boms.length > 0 ? boms[0] : data;

    const isActuallyOverdue = data.end_date_time && moment(data.end_date_time).isBefore(moment()) && data.status !== 'completed';

    return (
        <>
            {/* Overlay */}
            <div
                onClick={onClose}
                className="fixed inset-0 bg-black/40 z-[1040]"
            />

            {/* Right Drawer */}
            <div className="fixed top-0 right-0 h-screen w-[600px] bg-slate-50 z-[1050] flex flex-col shadow-2xl transition-transform duration-300">

                {/* Header */}
                <div className="px-5 py-4 bg-white border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight m-0">
                        Job Details
                    </h2>
                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                        Close ✕
                    </button>
                </div>

                {/* Alert Section */}
                {/* Admin/Head View: Pending Actions */}
                {((data?.is_qty_changed || data?.is_date_changed) && !isAssemblyNotHead && !isAssemblyHead) && (
                    <div className="px-5 py-3 bg-slate-50 border-b border-gray-100 flex flex-col gap-2">
                        {data?.is_qty_changed && (
                            <div className="bg-violet-50 rounded-xl border border-violet-100 p-3 shadow-sm flex items-center justify-between">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2 text-violet-700">
                                        <span className="text-sm">📊</span>
                                        <span className="text-[12px] font-black uppercase tracking-wider">
                                            {data.is_order_qty_changed ? "ORDER QTY CHANGED" : "ALLOCATION GAP DETECTED"}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="bg-white px-3 py-1.5 rounded-lg shadow-sm border border-violet-200 flex items-center gap-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Target:</span>
                                        <span className="text-sm font-black text-violet-600 tabular-nums">{data.master_qty}</span>
                                        {!data.team_id && (
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const res = await dispatch(acknowledgeQtyChange({ assembly_job_id: data._id }));
                                                        if (acknowledgeQtyChange.fulfilled.match(res)) {
                                                            toast.success("Quantity accepted");
                                                            dispatch(fetchTeamProductionJobs()); // Refresh Lanes
                                                            onRefresh?.();                       // Refresh Unassigned
                                                            onClose();
                                                        }
                                                    } catch (err) { /* ignore */ }
                                                }}
                                                className="px-2 py-0.5 bg-violet-600 text-white text-[9px] font-black rounded uppercase shadow-sm active:scale-95"
                                            >
                                                Accept
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {data?.is_date_changed && (
                            <div className="bg-orange-50 rounded-xl border border-orange-100 p-3 shadow-sm flex items-center justify-between">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2 text-orange-700">
                                        <span className="text-sm">📅</span>

                                        <span className="text-[10px] font-black uppercase tracking-tight italic">Job Completion Date</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="bg-white px-3 py-1.5 rounded-lg shadow-sm border border-orange-200 flex items-center gap-3">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Target:</span>
                                        <span className="text-sm font-black text-orange-600 tabular-nums italic">
                                            {moment(data.current_job_completion_date, ['YYYY-MM-DDTHH:mm', 'YYYY-MM-DD', 'DD-MM-YYYY']).isValid()
                                                ? moment(data.current_job_completion_date, ['YYYY-MM-DDTHH:mm', 'YYYY-MM-DD', 'DD-MM-YYYY']).format('DD-MM-YYYY')
                                                : 'Pending'}
                                        </span>
                                        {(!data.is_deadline_breached) ? (
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const res = await dispatch(acknowledgeDateChange({ assembly_job_id: data._id }));
                                                        if (acknowledgeDateChange.fulfilled.match(res)) {
                                                            toast.success("Deadline accepted");
                                                            dispatch(fetchTeamProductionJobs()); // Refresh Lanes
                                                            onRefresh?.();                       // Refresh Unassigned
                                                            onClose();
                                                        }
                                                    } catch (err) { /* ignore */ }
                                                }}
                                                className="px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-black rounded uppercase shadow-sm active:scale-95"
                                            >
                                                Accept
                                            </button>
                                        ) : (
                                            <div className="px-3 py-1.5 bg-red-100 text-red-600 text-[9px] font-black uppercase rounded border border-red-200">
                                                Re-Schedule Required
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Assembly Not Head View: Informational Alerts (Now visible to Head as well) */}
                {((data?.isNotHeadQty || data?.isNotHeadDate) && (!isAdmin && !isOperatingDirector)) && (
                    <div className="px-5 py-3 bg-slate-50 border-b border-gray-100 flex flex-col gap-2">
                        {/* Localized Qty Shift Alert (Visible to both assigned team and Assembly Head) */}
                        {data?.isNotHeadQty && (
                            <div className="bg-violet-50 rounded-xl border border-violet-100 p-3 shadow-sm flex items-center justify-between">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2 text-violet-700">
                                        <span className="text-sm">📊</span>
                                        <span className="text-[11px] font-black uppercase tracking-wider">Production Quantity Updated</span>
                                    </div>
                                    {data.prevNotHeadQty != null && (
                                        <div className="flex items-center gap-1.5 ml-7">
                                            <span className="text-[12px] font-bold text-violet-400 line-through tabular-nums">{data.prevNotHeadQty}</span>
                                            <span className="text-violet-400">→</span>
                                            <span className="text-[12px] font-black text-violet-600 tabular-nums">
                                                {data.prevNotHeadQty !== data.qty ? data.qty : data.opQty}
                                            </span>
                                            {data.prevNotHeadQty !== data.qty && <span className="text-[12px] font-bold text-violet-400 ml-1">(Assigned)</span>}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={async () => {
                                        try {
                                            const res = await dispatch(acknowledgeNotHeadAlert({ assembly_job_id: data._id, type: 'qty' }));
                                            if (acknowledgeNotHeadAlert.fulfilled.match(res)) {
                                                toast.success("Quantity update acknowledged");
                                                dispatch(fetchTeamProductionJobs());
                                            }
                                        } catch (err) { /* ignore */ }
                                    }}
                                    className="px-2 py-1 bg-violet-600 text-white text-[9px] font-black rounded uppercase shadow-sm active:scale-95"
                                >
                                    OK
                                </button>
                            </div>
                        )}

                        {/* Localized Date Shift Alert (Visible to both assigned team and Assembly Head) */}
                        {data?.isNotHeadDate && (
                            <div className="bg-orange-50 rounded-xl border border-orange-100 p-3 shadow-sm flex items-center justify-between">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2 text-orange-700">
                                        <span className="text-sm">📅</span>
                                        <span className="text-[11px] font-black uppercase tracking-wider">Schedule Rescheduled</span>
                                    </div>
                                    {/* Master Deadline Change */}
                                    {data.prevNotHeadDate && data.prevNotHeadDate !== data.opJobCompDate && (
                                        <div className="flex flex-col ml-7">
                                            <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider mb-0.5">Master Deadline Change</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[12px] font-bold text-orange-400 line-through tabular-nums">
                                                    {moment(data.prevNotHeadDate, ['YYYY-MM-DDTHH:mm', 'YYYY-MM-DD', 'DD-MM-YYYY']).format('DD-MM-YYYY')}
                                                </span>
                                                <span className="text-orange-400">→</span>
                                                <span className="text-[12px] font-black text-orange-600 tabular-nums">
                                                    {moment(data.opJobCompDate, ['YYYY-MM-DDTHH:mm', 'YYYY-MM-DD', 'DD-MM-YYYY']).format('DD-MM-YYYY')}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    {/* Local Schedule Shift */}
                                    {(data.prevNotHeadStart || data.prevNotHeadEnd) && (
                                        <div className="flex flex-col ml-7 mt-1 gap-2">
                                            {data.prevNotHeadStart && moment(data.prevNotHeadStart).valueOf() !== moment(data.start_date_time).valueOf() && (
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider mb-0.5">Start Date Shift</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[12px] font-bold text-orange-400 line-through tabular-nums">
                                                            {moment(data.prevNotHeadStart).format('DD-MM HH:mm')}
                                                        </span>
                                                        <span className="text-orange-400">→</span>
                                                        <span className="text-[12px] font-black text-orange-600 tabular-nums">
                                                            {moment(data.start_date_time).format('DD-MM HH:mm')}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                            {data.prevNotHeadEnd && moment(data.prevNotHeadEnd).valueOf() !== moment(data.end_date_time).valueOf() && (
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider mb-0.5">End Date Shift</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[12px] font-bold text-orange-400 line-through tabular-nums">
                                                            {moment(data.prevNotHeadEnd).format('DD-MM HH:mm')}
                                                        </span>
                                                        <span className="text-orange-400">→</span>
                                                        <span className="text-[12px] font-black text-orange-600 tabular-nums">
                                                            {moment(data.end_date_time).format('DD-MM HH:mm')}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={async () => {
                                        try {
                                            const res = await dispatch(acknowledgeNotHeadAlert({ assembly_job_id: data._id, type: 'date' }));
                                            if (acknowledgeNotHeadAlert.fulfilled.match(res)) {
                                                toast.success("Schedule update acknowledged");
                                                dispatch(fetchTeamProductionJobs());
                                            }
                                        } catch (err) { /* ignore */ }
                                    }}
                                    className="px-2 py-1 bg-orange-600 text-white text-[9px] font-black rounded uppercase shadow-sm active:scale-95"
                                >
                                    OK
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">

                    {/* Basic Info Card */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5 flex gap-4 mb-5 shadow-sm">
                        <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                            <img
                                src={data?.image || ""}
                                alt="Product"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            {/* {canViewHistory && ( */}
                            <div className="text-lg font-bold text-slate-700 leading-tight mb-1">
                                <b>Client Name:</b> {data?.client_name || data?.sales_order_id?.client_name || ""}
                            </div>
                            {/* )} */}
                            {/* <div className="text-sm font-bold text-slate-500 mb-3 truncate">
                                {data?.product_name || data?.sales_order_id?.product_name || "-"}
                            </div> */}

                            <div className="flex flex-wrap gap-2">
                                {[
                                    ["Job No", data.sub_job_no || data.job_no],
                                    ["Reference No", data.reference_no || data.enquiry_id?.reference_no || data.sales_order_id?.enquiry_id?.reference_no || "-"],
                                    ["Product Name", data.product_name || data.sales_order_id?.product_name || "-"],
                                    ["Quantity", data.qty || data.job_quantity || data.quantity || "-"],
                                    ["Status", data.status || "NEW"],
                                    ["Job Completion Date", (() => {
                                        const d = data.opJobCompDate || data.job_completion_datetime || data.current_job_completion_date;
                                        return d ? moment(d, ['YYYY-MM-DDTHH:mm', 'DD-MM-YYYY']).format('DD-MM-YYYY HH:mm') : "-";
                                    })()],
                                    data.assigned_by ? ["Assigned By", data.assigned_by.username || "Unknown"] : null,
                                    data.start_date_time ? ["Start", moment(data.start_date_time).format('DD-MM-YYYY HH:mm')] : null,
                                    data.end_date_time ? ["End", moment(data.end_date_time).format('DD-MM-YYYY HH:mm')] : null,
                                ].filter(Boolean).map(([label, value]) => (
                                    <div key={label} className="border border-gray-200 rounded-lg px-3 py-2 min-w-[100px] bg-gray-50/50">
                                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">
                                            {label}
                                        </div>
                                        <div className={`text-sm font-bold text-slate-800 truncate ${label === "Status" ? "uppercase" : ""}`}>
                                            {value}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Alerts Section */}
                    {/* {(data?.is_qty_changed || data?.is_date_changed) && (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm mb-5 p-4 space-y-4">
                            <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                <span className="text-red-500">⚠</span> Operational Alerts
                            </h4>

                            {data?.is_qty_changed && (
                                <div className="p-3 bg-orange-50 rounded-xl border border-orange-100 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Quantity Changed</div>
                                        <div className="text-xs text-slate-600">The manufacturing quantity has been updated.</div>
                                    </div>
                                    <div className="flex items-center gap-4 text-center">
                                        <div>
                                            <div className="text-[9px] font-black text-slate-400 uppercase">Old</div>
                                            <div className="text-sm font-black text-slate-400 line-through decoration-slate-400">{data.opQty || "N/A"}</div>
                                        </div>
                                        <div className="text-orange-400">➔</div>
                                        <div>
                                            <div className="text-[9px] font-black text-orange-600 uppercase">New</div>
                                            <div className="text-sm font-black text-orange-600">{data.current_qty}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {data?.is_date_changed && (
                                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Date Changed</div>
                                        <div className="text-xs text-slate-600">The job completion date has been rescheduled.</div>
                                    </div>
                                    <div className="flex items-center gap-4 text-center">
                                        <div>
                                            <div className="text-[9px] font-black text-slate-400 uppercase">Old</div>
                                            <div className="text-sm font-black text-slate-400 line-through decoration-slate-400">{data.opJobCompDate ? moment(data.opJobCompDate, 'DD-MM-YYYY').format('MMM DD') : "N/A"}</div>
                                        </div>
                                        <div className="text-indigo-400">➔</div>
                                        <div>
                                            <div className="text-[9px] font-black text-indigo-600 uppercase">New</div>
                                            <div className="text-sm font-black text-indigo-600">{data.current_job_completion_date ? moment(data.current_job_completion_date, 'DD-MM-YYYY').format('MMM DD') : "N/A"}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )} */}

                    {/* Department Processes List */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm mb-5">
                        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                            <h4 className="text-base font-bold text-slate-800 m-0">Production Processes</h4>
                        </div>

                        <div className="p-5">
                            {loading ? (
                                <div className="text-center py-8 text-gray-500">Loading process data...</div>
                            ) : Object.keys(groupedProcessesByDepartment).length > 0 ? (
                                Object.entries(groupedProcessesByDepartment).map(([department, processes]) => (
                                    <div key={department} className="mb-6 last:mb-0">
                                        <div className="text-sm font-bold text-slate-700 mb-3 px-3 py-1.5 bg-slate-100">
                                            {department}
                                        </div>

                                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                            <table className="w-full text-sm text-left">
                                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                                                    <tr>
                                                        <th className="px-4 py-3 font-semibold w-12">#</th>
                                                        <th className="px-4 py-3 font-semibold">Process Name</th>
                                                        <th className="px-4 py-3 font-semibold w-24">Req Qty</th>
                                                        <th className="px-4 py-3 font-semibold w-24">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {processes.map((process, idx) => (
                                                        <tr key={`${department}-${process.process_id}-${idx}`} className="hover:bg-gray-50/50">
                                                            <td className="px-4 py-3 text-gray-500">
                                                                {process.process_index || idx + 1}
                                                            </td>
                                                            <td className="px-4 py-3 font-medium text-slate-800">
                                                                {process.process_name}
                                                            </td>
                                                            <td className="px-4 py-3 text-slate-600">
                                                                {process.order_qty || "-"}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                                    Pending
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-400 italic border-2 border-dashed border-gray-100 rounded-lg">
                                    No process data available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Reassign History Section */}
                    {canViewHistory && data?.reassign_history && data.reassign_history.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">

                            {/* Header */}
                            <div className="px-5 py-3 border-b border-gray-100 bg-amber-50/50 flex justify-between items-center">
                                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <span className="text-amber-500">🔄</span> Handover History
                                </h4>
                                <span className="text-xs font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-md">
                                    {data.reassign_history.length} Reassignments
                                </span>
                            </div>

                            {/* Rows */}
                            <div className="divide-y divide-gray-100">
                                {data.reassign_history.map((h, i) => {
                                    const isSplit = h.action && (h.action.toLowerCase().includes('reallocated') || h.action.toLowerCase().includes('team(s)'));
                                    const fromQty = h.from_qty != null ? h.from_qty : null;
                                    const toQty = h.to_qty != null ? h.to_qty : null;

                                    return (
                                        <div key={i}>
                                            {/* 3-column grid */}
                                            <div className="grid grid-cols-3 divide-x divide-gray-100">

                                                {/* Col 1 — Who & When */}
                                                <div className="px-4 py-3">
                                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">Who & When</p>
                                                    <p className="text-[13px] font-bold text-slate-800 mb-0.5">
                                                        {h.reassigned_by?.username || "System"}
                                                    </p>
                                                    <p className="text-[12px] text-slate-500">
                                                        {moment(h.date).format('DD-MM-YYYY')}
                                                    </p>
                                                    <p className="text-[12px] text-slate-400">
                                                        {moment(h.date).format('HH:mm:ss')}
                                                    </p>
                                                </div>

                                                {/* Col 2 — Team Transfer / Split Info */}
                                                <div className="px-4 py-3">
                                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">Team Transfer</p>

                                                    {isSplit ? (
                                                        // Split/Reallocation: show FROM team + action label (no arrow diagram)
                                                        <div className="space-y-1.5">
                                                            <div className="flex flex-col gap-1.5">
                                                                {h.from_split_details && h.from_split_details.length > 0 ? (
                                                                    h.from_split_details.map((fs, idx) => (
                                                                        <div key={idx} className="inline-flex">
                                                                            <span className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded-md">
                                                                                {fs.team_id?.team_name || "Previous"} <span className="opacity-50">({fs.qty || 0})</span>
                                                                            </span>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="inline-flex">
                                                                        <span className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded-md">
                                                                            {h.from_team?.team_name || "Previous"}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className="inline-block text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-md uppercase tracking-wide leading-tight">
                                                                {h.action}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        // Single reassign: keep the arrow diagram
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <span className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded-md">
                                                                    {h.from_team?.team_name || "N/A"}
                                                                </span>
                                                                <span className="text-slate-300 text-xs">→</span>
                                                                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md">
                                                                    {h.to_team?.team_name || "N/A"}
                                                                </span>
                                                            </div>
                                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">
                                                                {h.action || "Updated"}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Qty change badge */}
                                                    {fromQty != null && toQty != null && fromQty !== toQty && (
                                                        <div className="mt-1.5 flex items-center gap-1 text-[11px] font-bold">
                                                            <span className="text-slate-400 line-through">{fromQty}</span>
                                                            <span className="text-slate-300">→</span>
                                                            <span className="text-violet-600">{toQty}</span>
                                                            <span className="text-slate-400 font-normal">units</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Col 3 — Schedule */}
                                                <div className="px-4 py-3">
                                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">Schedule</p>
                                                    {/* Was (old schedule) */}
                                                    {!isSplit && !(h.from_split_details && h.from_split_details.length > 1) && (
                                                        <p className="text-[12px] text-slate-500 mb-1">
                                                            <span className="text-slate-400">Was: </span>
                                                            {h.from_start_date_time ? moment(h.from_start_date_time).format('DD-MM-YY HH:mm') : '—'}
                                                            {' → '}
                                                            {h.from_end_date_time ? moment(h.from_end_date_time).format('DD-MM-YY HH:mm') : '—'}
                                                        </p>
                                                    )}
                                                    {isSplit ? (
                                                        // Split: Map through each team's split details
                                                        <div className="mt-2 space-y-2 border-t border-gray-100 pt-2">
                                                            {h.split_details && h.split_details.length > 0 ? (
                                                                h.split_details.map((sd, sidx) => (
                                                                    <div key={sidx} className="bg-indigo-50/50 p-1.5 rounded-md border border-indigo-100/50">
                                                                        <div className="flex justify-between items-center mb-0.5">
                                                                            <span className="text-[10px] font-bold text-indigo-700">
                                                                                {sd.team_id?.team_name || "Unknown Team"}
                                                                            </span>
                                                                            <span className="text-[10px] font-black text-violet-600 bg-violet-100 px-1.5 rounded">
                                                                                {sd.qty} units
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-[11px] font-medium text-slate-600 leading-tight">
                                                                            {sd.start_date_time ? moment(sd.start_date_time).format('DD-MM-YY HH:mm') : '—'}
                                                                            {' → '}
                                                                            {sd.end_date_time ? moment(sd.end_date_time).format('DD-MM-YY HH:mm') : '—'}
                                                                        </p>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <p className="text-[10px] text-indigo-400 italic">
                                                                    Details not available for legacy splits
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className="text-[11px] font-bold text-indigo-600">
                                                            <span className="text-slate-400 font-normal">Now: </span>
                                                            {h.to_start_date_time ? moment(h.to_start_date_time).format('DD-MM-YY HH:mm') : '—'}
                                                            {' → '}
                                                            {h.to_end_date_time ? moment(h.to_end_date_time).format('DD-MM-YY HH:mm') : '—'}
                                                        </p>
                                                    )}
                                                </div>

                                            </div>

                                            {/* Note row — full width, only if present */}
                                            {h.note && (
                                                <div className="px-4 py-2.5 bg-amber-50/60 border-t border-amber-100 flex items-start gap-2">
                                                    <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded shrink-0">
                                                        Note
                                                    </span>
                                                    <p className="text-[11px] italic text-amber-900 leading-relaxed m-0">
                                                        "{h.note}"
                                                    </p>
                                                </div>
                                            )}

                                        </div>
                                    );
                                })}
                            </div>

                        </div>
                    )}

                </div>

                {/* Footer Action */}
                <div className="p-5 bg-white border-t border-gray-200">
                    <button
                        onClick={() => setShowJobDetailsPopup(true)}
                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 transform active:scale-[0.98]"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Job Sheet
                    </button>
                </div>

            </div>

            {/* Job Details Popup Logic */}
            <JobDetailsPopup
                show={showJobDetailsPopup}
                onClose={() => setShowJobDetailsPopup(false)}
                bomData={currentBomData}
                groupedProcesses={groupedProcessesByDepartment}
            />
        </>
    );
};

export default JobDetailsDrawer;