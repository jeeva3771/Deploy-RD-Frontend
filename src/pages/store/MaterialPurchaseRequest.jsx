import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchAllMaterialPurchaseRequests,
    approveMaterialPurchaseRequest,
    rejectMaterialPurchaseRequest
} from "../../reducer/materialPurchaseRequestReducer";
import { toast } from "react-toastify";
import MaterialPurchaseRequestModal from "./components/MaterialPurchaseRequestModal";
import MaterialPurchaseRequestDetailsModal from "./components/MaterialPurchaseRequestDetailsModal";
import { getUserPermissions } from "../../utils/permission/auth";
import { useAuthData } from "../../utils/hooks/useAuthData";
import { FormControl, Select, MenuItem } from "@mui/material";

const MaterialPurchaseRequest = () => {
    const dispatch = useDispatch();
    const { requests, loading } = useSelector((state) => state.materialPurchaseRequest);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewedRequest, setViewedRequest] = useState(null);
    const [remark, setRemark] = useState("");
    const [activeRequestId, setActiveRequestId] = useState(null);
    const [selectedCreatorId, setSelectedCreatorId] = useState(null);
    const [requestToEdit, setRequestToEdit] = useState(null);

    const handleEditClick = (req) => {
        setRequestToEdit(req);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setRequestToEdit(null), 300); // clear after animation
    };

    const { AdminRole, isHead, departmentName } = useAuthData();
    const currentUserPermissions = getUserPermissions().map(String);
    const isStoreHead = isHead && (currentUserPermissions.includes("33") || departmentName?.toLowerCase()?.includes("store"));

    const uniqueCreators = React.useMemo(() => {
        const creatorsMap = new Map();
        requests.forEach(req => {
            if (req.requested_by?._id) {
                creatorsMap.set(req.requested_by._id, req.requested_by);
            }
        });
        return Array.from(creatorsMap.values());
    }, [requests]);

    const filteredRequests = React.useMemo(() => {
        if (!selectedCreatorId) return requests;
        return requests.filter(req => req.requested_by?._id === selectedCreatorId);
    }, [requests, selectedCreatorId]);

    const canApprove = (req) => {
        if (AdminRole) return true; // Admin can approve both Store and Admin stages
        if (isStoreHead && req.status === 'PENDING_STORE_HEAD') return true; // Store Head can only approve the first stage
        return false;
    };

    useEffect(() => {
        dispatch(fetchAllMaterialPurchaseRequests());
    }, [dispatch]);

    const handleApprove = async (requestId, modalRemark) => {
        try {
            await dispatch(approveMaterialPurchaseRequest({ requestId, remark: modalRemark !== undefined ? modalRemark : remark })).unwrap();
            toast.success("Request approved successfully");
            setRemark("");
            setActiveRequestId(null);
            setViewedRequest(null);
        } catch (err) {
            toast.error(err?.message || "Approval failed");
        }
    };

    const handleReject = async (requestId, modalRemark) => {
        const finalRemark = modalRemark !== undefined ? modalRemark : remark;
        if (!finalRemark) {
            toast.warning("Please provide a remark for rejection");
            return;
        }
        try {
            await dispatch(rejectMaterialPurchaseRequest({ requestId, remark: finalRemark })).unwrap();
            toast.success("Request rejected successfully");
            setRemark("");
            setActiveRequestId(null);
            setViewedRequest(null);
        } catch (err) {
            toast.error(err?.message || "Rejection failed");
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "PENDING_STORE_HEAD": return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending Store Head</span>;
            case "PENDING_ADMIN_HEAD": return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Pending HR & Admin Head</span>;
            case "APPROVED": return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Approved</span>;
            case "REJECTED": return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Rejected</span>;
            default: return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    return (
        <div className="bg-white p-6 mt-5" style={{ minHeight: "calc(100vh - 200px)" }}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 px-2 gap-4">
                <div>
                    <h1 className="text-3xl font-[1000] italic text-[#111827] tracking-tighter uppercase leading-none">
                        MATERIAL PURCHASE REQUESTS
                    </h1>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    {/* Filter Row */}
                    {(AdminRole || isStoreHead) && (
                        <FormControl
                            variant="outlined"
                            size="small"
                            className="w-full sm:min-w-[280px]"
                        >
                            <Select
                                value={selectedCreatorId || ""}
                                onChange={(e) => setSelectedCreatorId(e.target.value === "" ? null : e.target.value)}
                                displayEmpty
                                size="small"
                                className="bg-white capitalize text-xs tracking-wide shadow-sm rounded-lg"
                                inputProps={{
                                    style: { paddingRight: "32px", paddingLeft: "12px", paddingTop: "10px", paddingBottom: "10px" },
                                }}
                                MenuProps={{
                                    PaperProps: { className: "min-w-[280px]" },
                                }}
                            >
                                <MenuItem value="">
                                    <span className="text-slate-400 font-bold italic uppercase tracking-widest text-[10px]">All Requesters</span>
                                </MenuItem>
                                {uniqueCreators.map((creator) => (
                                    <MenuItem
                                        key={creator._id}
                                        value={creator._id}
                                        className="capitalize"
                                    >
                                        <span className="font-bold text-slate-700 italic uppercase tracking-wider text-xs">{creator.name}</span>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                    <button
                        onClick={() => {
                            setRequestToEdit(null);
                            setIsModalOpen(true);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black py-2.5 px-6 rounded-lg flex items-center justify-center shadow-lg transition-all active:scale-95 italic uppercase tracking-wider w-full sm:w-auto whitespace-nowrap"
                    >
                        <i className="fas fa-plus mr-2"></i>
                        NEW REQUEST
                    </button>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 h-[calc(100vh-215px)]">
                {loading ? (
                    <div className="flex justify-center p-12 col-span-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    [
                        { id: 'PENDING_STORE_HEAD', title: 'PENDING STORE', headerColor: 'bg-[#B45309]', bodyColor: 'bg-[#F8FAFC]', cardBorder: 'border-[#B45309]', cardBg: 'bg-[#FFFBEB]', accent: 'bg-[#B45309]' },
                        { id: 'PENDING_ADMIN_HEAD', title: 'PENDING HR & ADMIN', headerColor: 'bg-[#1F2937]', bodyColor: 'bg-[#F8FAFC]', cardBorder: 'border-[#E2E8F0]', cardBg: 'bg-white', accent: 'bg-[#1F2937]' },
                        { id: 'APPROVED', title: 'APPROVED', headerColor: 'bg-[#059669]', bodyColor: 'bg-[#F8FAFC]', cardBorder: 'border-[#059669]', cardBg: 'bg-[#F0FDF4]', accent: 'bg-[#059669]' },
                        { id: 'REJECTED', title: 'REJECTED', headerColor: 'bg-[#F05252]', bodyColor: 'bg-[#F8FAFC]', cardBorder: 'border-[#F05252]', cardBg: 'bg-[#FFF5F5]', accent: 'bg-[#F05252]' }
                    ].map(col => {
                        const colRequests = filteredRequests.filter(r => r.status === col.id);
                        return (
                            <div key={col.id} className={`${col.bodyColor} rounded-[2.5rem] shadow-[0_15px_40px_-10px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden border border-gray-200`}>
                                {/* Section Header */}
                                <div className={`${col.headerColor} p-4 px-8 flex justify-between items-center text-white rounded-t-[2.5rem]`}>
                                    <span className="font-black text-lg italic tracking-tighter uppercase">{col.title}</span>
                                    <span className="font-black text-xl italic">{colRequests.length}</span>
                                </div>

                                {/* List */}
                                <div className="flex-1 overflow-y-auto mt-2 mb-6 px-5 pb-2 space-y-4 pt-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent scroll-auto">
                                    {colRequests.length === 0 ? (
                                        <div className="h-full flex flex-col justify-center items-center text-center opacity-50 p-6">
                                            <i className="fas fa-inbox text-4xl mb-3 text-slate-300"></i>
                                            <p className="text-[10px] font-black italic uppercase text-slate-400 tracking-widest leading-relaxed">No requests<br />in this stage</p>
                                        </div>
                                    ) : (
                                        colRequests.map((req) => (
                                            <div
                                                key={req._id}
                                                className={`${col.cardBg} border-2 ${col.cardBorder} rounded-3xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group/card relative overflow-hidden pl-7`}
                                            >
                                                {/* Priority/Status Indicator Line */}
                                                <div className={`absolute left-0 top-0 bottom-0 w-2 h-full ${col.accent}`}></div>

                                                {/* Card Header */}
                                                <div className="pb-2">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <div className="flex flex-col">
                                                            <button onClick={() => setViewedRequest(req)} className="text-left outline-none text-slate-800 font-[1000] italic underline text-base leading-tight tracking-tight uppercase group-hover/card:text-blue-600 transition-colors">
                                                                {req.request_number}
                                                            </button>
                                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">
                                                                By {req.requested_by?.name}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-2">
                                                            {/* <div className="text-right mt-0.5">
                                                                <div className="text-[10px] font-black text-slate-500 uppercase italic tracking-tighter">
                                                                    {new Date(req.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}
                                                                </div>
                                                                <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest leading-none mt-0.5">
                                                                        {new Date(req.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                                                    </div>
                                                            </div> */}
                                                            <div className="flex items-center gap-1">
                                                                {req.status !== 'APPROVED' && req.status !== 'REJECTED' && (
                                                                    <button onClick={() => handleEditClick(req)} className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-orange-100 text-slate-400 hover:text-orange-600 rounded-lg transition-colors group/editbtn shadow-sm border border-slate-200 hover:border-orange-200">
                                                                        <i className="fas fa-edit text-[10px] group-hover/editbtn:scale-110 transition-transform"></i>
                                                                    </button>
                                                                )}
                                                                <button onClick={() => setViewedRequest(req)} className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors group/viewbtn shadow-sm border border-slate-200 hover:border-indigo-200">
                                                                    <i className="fas fa-eye text-[10px] group-hover/viewbtn:scale-110 transition-transform"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Items Summary Container */}
                                                <div className="px-4 py-2 space-y-2">
                                                    {req.items.slice(0, 1).map((item, idx) => (
                                                        <div key={idx} className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex justify-between items-center transition-all">
                                                            <div className="flex-1 truncate pr-2">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="font-[900] text-slate-700 text-[10px] italic uppercase tracking-tight truncate">{item.item_name}</span>
                                                                    {item.is_new_item && (
                                                                        <span className="text-[7px] bg-purple-600 text-white px-1 py-0.5 rounded italic font-black uppercase tracking-tighter shrink-0">NEW</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="text-right shrink-0 bg-white px-2 py-0.5 rounded-lg shadow-sm border border-slate-100">
                                                                <span className="text-xs font-[1000] italic text-indigo-600">{item.required_qty}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {req.items.length > 1 && (
                                                        <div className="text-center text-[9px] font-bold italic text-slate-400 bg-slate-50 rounded-xl py-1">
                                                            +{req.items.length - 1} more items...
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Footer Approvals */}
                                                <div className="p-4 pt-3 mt-1 bg-slate-50 border-t border-slate-100">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center gap-1.5">
                                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] ${req.store_head_approval?.approved_by ? 'bg-green-500 text-white shadow-md border-0' : (req.status === 'REJECTED' || req.rejection_details?.remark?.includes('Store Head Escalation') ? 'bg-red-50 text-red-400' : 'bg-white border border-slate-200 text-slate-300')}`}>
                                                                    {req.store_head_approval?.approved_by ? <i className="fas fa-check"></i> : (req.status === 'REJECTED' || req.rejection_details?.remark?.includes('Store Head Escalation') ? <i className="fas fa-ban"></i> : <i className="fas fa-clock"></i>)}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className={`text-[8px] font-[1000] uppercase italic tracking-tighter leading-none ${(req.status === 'REJECTED' || req.rejection_details?.remark?.includes('Store Head Escalation')) && !req.store_head_approval?.approved_by ? 'text-red-400 opacity-80 line-through' : 'text-slate-600'}`}>
                                                                        {req.store_head_approval?.approved_by ? req.store_head_approval.approved_by.name?.split(' ')[0] || 'Store' : 'Store'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <i className="fas fa-arrow-right text-slate-200 text-[8px] mx-0.5"></i>
                                                            <div className="flex items-center gap-1.5">
                                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] ${req.admin_head_approval?.approved_by ? 'bg-green-500 text-white shadow-md border-0' : (req.status === 'REJECTED' && !req.rejection_details?.remark?.includes('Store Head Escalation') ? 'bg-red-50 text-red-400' : 'bg-white border border-slate-200 text-slate-300')}`}>
                                                                    {req.admin_head_approval?.approved_by ? <i className="fas fa-check"></i> : (req.status === 'REJECTED' && !req.rejection_details?.remark?.includes('Store Head Escalation') ? <i className="fas fa-ban"></i> : <i className="fas fa-clock"></i>)}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className={`text-[8px] font-[1000] uppercase italic tracking-tighter leading-none ${req.status === 'REJECTED' && !req.admin_head_approval?.approved_by && !req.rejection_details?.remark?.includes('Store Head Escalation') ? 'text-red-400 opacity-80 line-through' : 'text-slate-600'}`}>
                                                                        {req.admin_head_approval?.approved_by ? req.admin_head_approval.approved_by.name?.split(' ')[0] || 'HR & Admin' : 'HR & Admin'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                                                            {req.items.length} ITEM(S)
                                                        </span>
                                                    </div>

                                                    {req.rejection_details?.rejected_by && (
                                                        <div className="mt-3 text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                                                            <span className="text-[10px] font-black italic tracking-tighter line-clamp-2 leading-tight">Rejected: {req.rejection_details.remark}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action Button */}
                                                {canApprove(req) && (col.id === 'PENDING_STORE_HEAD' || col.id === 'PENDING_ADMIN_HEAD') && (
                                                    <div className="p-3 bg-white border-t border-slate-100">
                                                        {activeRequestId === req._id ? (
                                                            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                                                <textarea
                                                                    className="w-full bg-slate-50 border-2 border-indigo-100 rounded-xl p-2 text-[11px] font-bold italic focus:border-indigo-500 outline-none placeholder:text-slate-300 resize-none"
                                                                    placeholder="Action remark..."
                                                                    rows="2"
                                                                    value={remark}
                                                                    onChange={(e) => setRemark(e.target.value)}
                                                                ></textarea>
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => { setActiveRequestId(null); setRemark(""); }}
                                                                        className="flex-1 py-1.5 text-[9px] font-black text-slate-400 hover:text-slate-600 uppercase italic tracking-widest border border-slate-200 rounded-lg"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleReject(req._id)}
                                                                        className="flex-1 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white py-1.5 rounded-lg text-[9px] font-black uppercase italic tracking-widest transition-all"
                                                                    >
                                                                        Reject
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleApprove(req._id)}
                                                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 rounded-lg text-[9px] font-black uppercase italic tracking-widest shadow-md transition-all"
                                                                    >
                                                                        Approve
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => setActiveRequestId(req._id)}
                                                                className="w-full bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-500 py-2 rounded-xl text-[10px] font-black italic uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 group border border-slate-100"
                                                            >
                                                                <i className="fas fa-bolt group-hover:animate-pulse"></i>
                                                                Process Request
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <MaterialPurchaseRequestModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                requestToEdit={requestToEdit}
            />

            <MaterialPurchaseRequestDetailsModal
                isOpen={!!viewedRequest}
                onClose={() => setViewedRequest(null)}
                request={viewedRequest}
                canApprove={viewedRequest ? canApprove(viewedRequest) : false}
                onApprove={handleApprove}
                onReject={handleReject}
            />


        </div>
    );
};

export default MaterialPurchaseRequest;
