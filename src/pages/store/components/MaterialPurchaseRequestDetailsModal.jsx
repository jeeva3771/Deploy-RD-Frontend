import React, { useState, useEffect } from "react";

const MaterialPurchaseRequestDetailsModal = ({ isOpen, onClose, request, canApprove, onApprove, onReject }) => {
    const [remark, setRemark] = useState("");

    useEffect(() => {
        if (!isOpen) setRemark("");
    }, [isOpen]);

    if (!isOpen || !request) return null;

    const handleApprove = () => onApprove(request._id, remark);
    const handleReject = () => onReject(request._id, remark);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-50/50">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-[1000] text-indigo-900 uppercase italic tracking-tight">{request.request_number}</h2>
                            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-3 py-1 rounded-full uppercase italic tracking-widest border border-indigo-200">
                                {request.status.replace(/_/g, " ")}
                            </span>
                        </div>
                        <p className="text-sm font-bold text-indigo-600/70 uppercase tracking-widest mt-1">Requested by {request.requested_by?.name}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition p-2 hover:bg-white rounded-full">
                        <i className="fas fa-times text-lg"></i>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-6">

                    {/* Items Table */}
                    <div>
                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 italic">Requested Items</h3>
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-100/50 border-b border-slate-200/50">
                                    <tr>
                                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest w-16 text-center">No.</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Item / Type</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Specification</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Purpose</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Quantity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {request.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-white transition-colors">
                                            <td className="px-4 py-3 text-xs font-bold text-slate-400 text-center">{idx + 1}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-[900] text-slate-700 text-xs italic uppercase">{item.item_name}</span>
                                                    {item.is_new_item && (
                                                        <span className="text-[8px] bg-purple-600 text-white px-1.5 py-0.5 rounded italic font-black uppercase shadow-sm">NEW</span>
                                                    )}
                                                </div>
                                                {/* {item.unit && <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">Unit: {item.unit}</div>} */}
                                            </td>
                                            <td className="px-4 py-3">
                                                {item.specification ? (
                                                    <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">{item.specification}</span>
                                                ) : (
                                                    <span className="text-[10px] text-slate-300 italic">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {item.purpose ? (
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase">{item.purpose}</span>
                                                ) : (
                                                    <span className="text-[10px] text-slate-300 italic">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="text-sm font-[1000] italic text-slate-800">{item.required_qty}</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Approvers Info */}
                    <div>
                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 italic">Approval Pipeline</h3>
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className={`flex-1 bg-white border-2 border-slate-100 rounded-2xl p-4 flex gap-4 items-center`}>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg ${request.store_head_approval?.approved_by ? 'bg-green-100 text-green-600' : (request.status === 'REJECTED' || request.rejection_details?.remark?.includes('Store Head Escalation') ? 'bg-red-50 text-red-300' : 'bg-slate-100 text-slate-400')}`}>
                                    <i className={request.store_head_approval?.approved_by ? 'fas fa-check' : (request.status === 'REJECTED' || request.rejection_details?.remark?.includes('Store Head Escalation') ? 'fas fa-ban' : 'fas fa-clock')}></i>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Store Head Stage</span>
                                    {request.store_head_approval?.approved_by ? (
                                        <>
                                            <span className="text-sm font-[1000] italic text-slate-700 uppercase">{request.store_head_approval.approved_by?.name || 'Store Head'}</span>
                                            {request.store_head_approval.remark && <span className="text-[10px] text-slate-500 font-bold uppercase mt-1">Remark: {request.store_head_approval.remark}</span>}
                                        </>
                                    ) : (
                                        <span className={`text-xs font-bold italic mt-1 ${request.status === 'REJECTED' || request.rejection_details?.remark?.includes('Store Head Escalation') ? 'text-red-300' : 'text-slate-400'}`}>
                                            {request.status === 'REJECTED' || request.rejection_details?.remark?.includes('Store Head Escalation') ? 'Rejected' : 'Pending action...'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-center text-slate-300 hidden md:flex">
                                <i className="fas fa-arrow-right"></i>
                            </div>

                            <div className="flex-1 bg-white border-2 border-slate-100 rounded-2xl p-4 flex gap-4 items-center">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg ${request.admin_head_approval?.approved_by ? 'bg-green-100 text-green-600' : (request.status === 'REJECTED' && !request.rejection_details?.remark?.includes('Store Head Escalation') ? 'bg-red-50 text-red-300' : 'bg-slate-100 text-slate-400')}`}>
                                    <i className={request.admin_head_approval?.approved_by ? 'fas fa-check' : (request.status === 'REJECTED' && !request.rejection_details?.remark?.includes('Store Head Escalation') ? 'fas fa-ban' : 'fas fa-clock')}></i>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">HR & Admin Stage</span>
                                    {request.admin_head_approval?.approved_by ? (
                                        <>
                                            <span className="text-sm font-[1000] italic text-slate-700 uppercase">{request.admin_head_approval.approved_by?.name || 'HR & Admin'}</span>
                                            {request.admin_head_approval.remark && <span className="text-[10px] text-slate-500 font-bold uppercase mt-1">Remark: {request.admin_head_approval.remark}</span>}
                                        </>
                                    ) : (
                                        <span className={`text-xs font-bold italic mt-1 ${request.status === 'REJECTED' && !request.rejection_details?.remark?.includes('Store Head Escalation') ? 'text-red-300' : 'text-slate-400'}`}>
                                            {request.status === 'REJECTED' && !request.rejection_details?.remark?.includes('Store Head Escalation') ? 'Rejected' : 'Pending action...'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {request.rejection_details?.rejected_by && (
                            <div className="mt-4 bg-red-50 border-2 border-red-100 rounded-2xl p-4 flex gap-4 items-center">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg bg-red-100 text-red-600">
                                    <i className={'fas fa-times'}></i>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">{request.status === 'REJECTED' && !request.rejection_details?.remark?.includes('Store Head Escalation') ? 'Rejected By' : 'Escalated/Rejected By'}</span>
                                    <span className="text-sm font-[1000] italic text-red-700 uppercase">{request.rejection_details.rejected_by?.name || 'Unknown'}</span>
                                    <span className="text-[10px] text-red-500 font-bold uppercase mt-1">Reason: {request.rejection_details.remark}</span>
                                </div>
                            </div>
                        )}

                        {canApprove && (request.status === 'PENDING_STORE_HEAD' || request.status === 'PENDING_ADMIN_HEAD') && (
                            <div className="mt-6 bg-slate-50 border-2 border-slate-200 rounded-3xl p-5">
                                <h3 className="text-sm font-[1000] text-indigo-900 uppercase italic tracking-tight mb-3">Process Request</h3>
                                <div className="space-y-3">
                                    <textarea
                                        className="w-full bg-white border-2 border-indigo-100 rounded-2xl p-4 text-xs font-bold italic focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                                        placeholder="ADD REMARK FOR THIS ACTION..."
                                        rows="3"
                                        value={remark}
                                        onChange={(e) => setRemark(e.target.value)}
                                    ></textarea>
                                    <div className="flex gap-3 justify-end mt-2">
                                        <button
                                            onClick={handleReject}
                                            className="px-6 py-2.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl text-[10px] font-black uppercase italic tracking-widest border border-red-100 transition-all active:scale-95"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={handleApprove}
                                            className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase italic tracking-widest shadow-lg shadow-indigo-100 transition-all active:scale-95"
                                        >
                                            Approve
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaterialPurchaseRequestDetailsModal;
