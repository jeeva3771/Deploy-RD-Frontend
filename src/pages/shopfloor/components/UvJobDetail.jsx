
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Zap, Monitor, Clock, Moon, Package, CheckSquare, Layers, Sun, Factory, Circle, CheckCircle2, MessageSquare, ShoppingCart, Flag, CheckCircle, User as UserIcon, AlertTriangle } from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal';
import { updateShopFloorJobStatus, clearShopFloorFlags, escalateShopFloorJob, deEscalateShopFloorJob } from '../../../reducer/shopFloorReducer';
import { toast } from 'react-toastify';
import DeliveryPriorityColor from '../../../components/deliveryPriorityColor/priorityColor';
import { getOutsourceVendorNameList } from '../../../reducer/outsourceVendorReducer';

const ReassignModal = ({ show, onClose, onConfirm, remark, setRemark, newShift, currentShift, isUv = false }) => {
  if (!show) return null;

  const getShiftName = (s) => {
    if (isUv) {
      return s === 1 ? 'Hantop' : s === 2 ? 'Mimaki' : 'Outsource';
    }
    return s === 4 ? 'Outsource' : `S${s}`;
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-sm p-8 animate-in zoom-in-95 duration-200" style={{ maxWidth: '400px' }}>
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-cyan-50 flex items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8 text-cyan-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 italic tracking-tighter uppercase mb-1">Reassign Job</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">
            Moving from <span className="text-slate-600 font-black">{getShiftName(currentShift)}</span> <br />
            to <span className="text-cyan-600 font-black">{getShiftName(newShift)}</span>
          </p>
        </div>

        <div className="space-y-4">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reason for change (Optional)</label>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="Why is this job being moved?"
            className="w-full h-32 p-4 rounded-[24px] bg-gray-50 border-2 border-transparent focus:border-cyan-500 focus:bg-white outline-none transition-all text-xs font-bold text-gray-700 placeholder:text-gray-300 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8">
          <button
            onClick={onClose}
            className="py-4 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 transition-all font-bold"
          >
            CANCEL
          </button>
          <button
            onClick={onConfirm}
            className="py-4 rounded-full bg-cyan-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-cyan-100 hover:bg-cyan-500 active:scale-95 transition-all"
          >
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  );
};

const UvJobDetail = ({ job, onClose, refreshData, onImageClick }) => {
  const dispatch = useDispatch();
  const [reassignModal, setReassignModal] = useState({ show: false, newShift: null, currentShift: null, groupId: null });
  const [reassignRemark, setReassignRemark] = useState("");
  const [outsourceMode, setOutsourceMode] = useState({ show: false, groupId: null, editIndex: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, groupId: null, index: null });
  const [warningModal, setWarningModal] = useState({ show: false, message: "" });
  const [escalateModal, setEscalateModal] = useState(false);
  const [deEscalateModal, setDeEscalateModal] = useState(false);
  const { outsourceVendors: vendors } = useSelector((state) => state.outsourceVendor);

  const getFilteredVendors = () => {
    if (!job?.process_name) return vendors;
    const normalize = (s) => (s || "").toLowerCase().replace(/\s+/g, "");
    const jobProcess = normalize(job.process_name);
    return vendors.filter(v =>
      v.process_type && (
        Array.isArray(v.process_type)
          ? v.process_type.some(p => normalize(p.name) === jobProcess)
          : normalize(v.process_type.name) === jobProcess
      )
    );
  };
  const [outsourceForm, setOutsourceForm] = useState({
    vendor_id: "",
    vendor_name: "",
    outsource_rate: "",
    outsource_qty: "",
    outsource_sheets: "",
    outsource_delivery_date: "",
    communication_mode: "whatsapp_and_email"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Per-group per-shift piece input state: { "groupId_shift": number }
  const [shiftPieceInputs, setShiftPieceInputs] = useState({});
  const getShiftPieces = (groupId, shift, defaultVal = 0) => {
    const raw = shiftPieceInputs[`${groupId}_${shift}`];
    return raw !== undefined ? (parseFloat(raw) || 0) : defaultVal;
  };
  const setShiftPieces = (groupId, shift, val) =>
    setShiftPieceInputs(prev => ({ ...prev, [`${groupId}_${shift}`]: val }));

  useEffect(() => {
    dispatch(getOutsourceVendorNameList());
  }, [dispatch]);

  const handleClearFlag = async (type) => {
    try {
      await dispatch(clearShopFloorFlags({ id: job._id, type })).unwrap();
      refreshData();
    } catch (error) {
      toast.error("Failed to clear notification");
    }
  };

  const isAssigned = (job?.assigned_shifts?.includes(1) || job?.assigned_shifts?.includes(2)) ||
    (job?.material_groups && job.material_groups.some(mg => mg.assigned_shifts?.includes(1) || mg.assigned_shifts?.includes(2)));

  if (!job) return null;

  const handleUpdateStatus = async (status, assigned_shift = null, remark = "") => {
    try {
      const response = await dispatch(updateShopFloorJobStatus({
        id: job._id,
        payload: {
          status: status || job.status,
          assigned_shift,
          remark
        }
      })).unwrap();

      if (response.success) {
        toast.success(`Job updated successfully`);
        refreshData();
      }
    } catch (error) {
      console.error("Error updating job:", error);
      toast.error("Failed to update job");
    }
  };

  const handleUpdateGroupShift = async (groupId, shift, remark = "", extra = {}) => {
    try {
      const response = await dispatch(updateShopFloorJobStatus({
        id: job._id,
        payload: {
          material_group_id: groupId,
          group_shift: shift,
          remark,
          ...extra
        }
      })).unwrap();

      if (response.success) {
        const message = extra.is_outsource
          ? (extra.outsource_details?.is_remove ? `Outsource removed successfully` : `Outsource assigned successfully`)
          : `Group assigned successfully`;
        toast.success(message);
        refreshData();
        if (extra.is_outsource) setOutsourceMode({ show: false, groupId: null, editIndex: null });
      }
    } catch (error) {
      console.error("Error updating group shift:", error);
      toast.error("Failed to update group shift");
    }
  };

  const isShiftActive = (shiftsArr, shift) => Array.isArray(shiftsArr) ? shiftsArr.includes(shift) : shiftsArr === shift;

  const handleEscalate = async () => {
    try {
      const response = await dispatch(escalateShopFloorJob({
        id: job._id
      })).unwrap();

      if (response.success) {
        toast.success("Job escalated to management");
        setEscalateModal(false);
        refreshData();
      }
    } catch (error) {
      console.error("Error escalating job:", error);
      toast.error("Failed to escalate job");
    }
  };

  const handleDeEscalate = async () => {
    try {
      const response = await dispatch(deEscalateShopFloorJob({
        id: job._id
      })).unwrap();

      if (response.success) {
        toast.success("Job de-escalated successfully");
        setDeEscalateModal(false);
        refreshData();
      }
    } catch (error) {
      console.error("Error de-escalating job:", error);
      toast.error("Failed to de-escalate job");
    }
  };

  const onShiftClick = (shift, currentShift, idOrIds) => {
    const targetId = Array.isArray(idOrIds) ? idOrIds[0] : (idOrIds || 'GLOBAL');
    const group = job.material_groups?.find(g =>
      String(g._id) === String(targetId) ||
      (g.group_id && String(g.group_id) === String(targetId))
    );

    // Validation: If trying to assign in-house shift (1,2) to a fully outsourced job
    if ([1, 2].includes(shift)) {
      const totalPieces = job.total_qty || 0;
      const assignedOutsource = group?.assigned_outsource_ups || group?.assigned_outsource_sheets || 0;

      if (assignedOutsource >= totalPieces && totalPieces > 0) {
        setWarningModal({
          show: true,
          message: "The entire job assigned to outsource if you need to assign shift reduce the assigned outsource qty or remove the outsource assign."
        });
        return;
      }
    }

    if (shift === 3) {
      if (targetId === 'GLOBAL') return;

      // If already assigned, do not open the form again via the shift button
      if (isShiftActive(group?.assigned_shifts, 3)) return;

      if (outsourceMode.show && String(outsourceMode.groupId) === String(targetId)) {
        setOutsourceMode({ show: false, groupId: null, group: null, editIndex: null });
        return;
      }

      let initialData = {
        vendor_id: "",
        vendor_name: "",
        outsource_rate: "",
        outsource_qty: "",
        outsource_sheets: "",
        outsource_delivery_date: "",
        communication_mode: "whatsapp_and_email"
      };

      if (group && !isShiftActive(group.assigned_shifts, 3)) {
        const totalPieces = job.total_qty || 0;
        const assignedPieces = (group.outsource_assignments || []).reduce((sum, a) => sum + (parseFloat(a.outsource_qty) || 0), 0);
        const remainingPieces = Math.max(0, totalPieces - assignedPieces);

        initialData = {
          vendor_id: group.vendor_id || group.outsource_details?.vendor_id || "",
          vendor_name: group.vendor_name || group.outsource_details?.vendor_name || "",
          outsource_rate: group.outsource_rate || group.outsource_details?.outsource_rate || "",
          outsource_qty: remainingPieces || totalPieces,
          outsource_sheets: remainingPieces || totalPieces,
          outsource_delivery_date: group.outsource_delivery_date || group.outsource_details?.outsource_delivery_date || "",
          communication_mode: group.outsource_details?.communication_mode || "whatsapp_and_email"
        };
      }

      setOutsourceForm(initialData);
      setOutsourceMode({ show: true, groupId: targetId, group, editIndex: null });
      return;
    }

    if (targetId && targetId !== 'GLOBAL') {
      handleUpdateGroupShift(targetId, shift);
    } else {
      handleUpdateStatus('In Progress', shift);
    }
  };

  const submitOutsource = async (uniqueId) => {
    if (isSubmitting) return;
    if (!outsourceForm.vendor_id) return toast.warning("Please select a vendor");
    if (!outsourceForm.outsource_qty || outsourceForm.outsource_qty <= 0) return toast.warning("Please enter pieces to outsource");
    if (!outsourceForm.outsource_rate || outsourceForm.outsource_rate <= 0) return toast.warning("Please enter the rate");
    if (!outsourceForm.outsource_delivery_date) return toast.warning("Please select a delivery date");

    const parseDateHelper = (dateStr) => {
      if (!dateStr) return null;
      if (typeof dateStr !== 'string') return new Date(dateStr);
      if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts[0].length === 2 && parts[2].length === 4) {
          return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
      }
      return new Date(dateStr);
    };

    if (outsourceForm.outsource_delivery_date) {
      const delDate = parseDateHelper(outsourceForm.outsource_delivery_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (delDate && delDate < today) {
        return toast.warning("Delivery date cannot be in the past");
      }

      if (job.job_completion_date) {
        const jobDate = parseDateHelper(job.job_completion_date);
        if (delDate && jobDate) {
          delDate.setHours(0, 0, 0, 0);
          jobDate.setHours(0, 0, 0, 0);
          if (delDate > jobDate) {
            return toast.warning(`Delivery date cannot be after job completion date (${job.job_completion_date})`);
          }
        }
      }
    }

    setIsSubmitting(true);
    try {
      await handleUpdateGroupShift(uniqueId, 3, "", {
        is_outsource: true,
        outsource_details: {
          vendor_id: outsourceForm.vendor_id,
          vendor_name: outsourceForm.vendor_name,
          outsource_rate: outsourceForm.outsource_rate,
          outsource_sheets: outsourceForm.outsource_qty,  // Save pieces as sheets for schema consistency
          outsource_ups: outsourceForm.outsource_qty,     // pieces
          outsource_delivery_date: outsourceForm.outsource_delivery_date,
          communication_mode: outsourceForm.communication_mode || "whatsapp_and_email",
          assignment_index: outsourceMode.editIndex
        }
      });
      setOutsourceMode({ show: false, groupId: null, group: null, editIndex: null });
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeOutsource = (uniqueId, index) => {
    setDeleteConfirm({ show: true, groupId: uniqueId, index });
  };

  const confirmRemove = () => {
    if (!deleteConfirm.groupId || deleteConfirm.index === null) return;

    handleUpdateGroupShift(deleteConfirm.groupId, 3, "", {
      is_outsource: true,
      outsource_details: {
        is_remove: true,
        assignment_index: deleteConfirm.index
      }
    });

    setDeleteConfirm({ show: false, groupId: null, index: null });
    setOutsourceMode({ show: false, groupId: null, group: null, editIndex: null });
  };

  const submitReassignment = () => {
    const { newShift, groupId } = reassignModal;
    if (groupId) {
      handleUpdateGroupShift(groupId, newShift, reassignRemark);
    } else {
      handleUpdateStatus('In Progress', newShift, reassignRemark);
    }
    setReassignModal({ show: false, newShift: null, currentShift: null, groupId: null });
  };

  return (
    <div className={`fixed top-0 right-0 h-full w-[600px] bg-white shadow-2xl z-[1040] flex flex-col animate-in slide-in-from-right duration-300 ${job.is_hold ? 'border-l-4 border-amber-500' : ''}`}>
      {job.is_hold && (
        <div className="absolute inset-x-0 top-0 h-1 bg-amber-500 animate-pulse z-[1050]" />
      )}
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-4">
            <div
              onClick={() => onImageClick?.(job.product_image)}
              className="w-20 h-20 rounded-2xl bg-gray-50 border border-gray-200 overflow-hidden flex-shrink-0 shadow-inner cursor-pointer relative group/img"
            >
              {job.product_image ? (
                <img src={job.product_image} alt={job.product_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-8 h-8 text-gray-200" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-white text-[10px] font-black uppercase tracking-widest">PREVIEW</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-[#0f172a] italic tracking-tighter leading-none">{job.job_no}/{job.sub_job_no}</h2>
                <div className="flex gap-1.5">
                  {job.job_type === 'sample' ? (
                    <span className="text-[8px] font-black py-1 px-2 bg-amber-500 text-white italic rounded-md shadow-sm">Sample</span>
                  ) : (
                    <span className="text-[8px] font-black py-1 px-2 bg-indigo-500 text-white italic rounded-md shadow-sm">Production</span>
                  )}
                  {job.sample_required && (
                    <span className="text-[8px] font-black py-1 px-2 bg-rose-600 text-white italic uppercase rounded-md shadow-sm animate-pulse">SAMPLE REQ.</span>
                  )}
                </div>
              </div>
              {job.reference_no && (
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">REF: {job.reference_no}</div>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">{job.client_name}</p>
                <DeliveryPriorityColor
                  deliveryDate={job.job_completion_date}
                  showPriorityName={true}
                  badgeClassName="!text-[8px] !font-black !py-0.5 !px-2 italic uppercase"
                />
                {job.process_name && (
                  <span className="text-[8px] font-black py-0.5 px-2 bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase rounded-md tracking-wider italic">
                    {job.process_name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <h3 className="text-sm font-black text-[#1e293b] uppercase">{job.product_name}</h3>
                {job.is_hold && (
                  <span className="text-[11px] font-black uppercase italic tracking-tight bg-amber-100 text-amber-600 py-1 px-2 rounded-md shadow-sm flex items-center gap-1 animate-pulse w-fit">
                    <Clock className="w-3 h-3" />
                    ON HOLD
                  </span>
                )}
                {job.is_reprocess && (
                  <span className="text-[8px] font-black py-1 px-2 bg-red-600 text-white italic uppercase rounded-md shadow-sm">Reprocess</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {job.is_escalated ? (
              <button
                onClick={() => setDeEscalateModal(true)}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-all group"
              >
                <CheckCircle className="w-3 h-3 fill-emerald-600 group-hover:scale-110 transition-transform" />
                DE-ESCALATE
              </button>
            ) : (
              <button
                onClick={() => setEscalateModal(true)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-widest border border-rose-100 hover:bg-rose-100 transition-all group ${job?.is_hold ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" : ""}`}
                disabled={job?.is_hold}
              >
                <Flag className="w-3 h-3 fill-rose-600 group-hover:scale-110 transition-transform" />
                ESCALATE
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col items-center">
            <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-1">TOTAL QTY</span>
            <span className="text-sm font-black text-slate-700 leading-none">{job.total_qty || 0}</span>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col items-center">
            <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-1">FINISH BY</span>
            <span className="text-[10px] font-black text-slate-700 leading-none">{job.job_completion_date || '-'}</span>
          </div>
        </div>

        {job.is_escalated && (
          <div className="mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-100 animate-pulse-red">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <h6 className="text-[11px] font-black text-rose-900 uppercase italic tracking-tight leading-none">Job Escalated</h6>
                  {(() => {
                    const lastEsc = [...(job.escalation_hold_history || [])].reverse().find(h => h.type === 'Escalated');
                    if (lastEsc) {
                      return (
                        <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest mt-1">
                          By {lastEsc.by?.name || "Admin"} · {lastEsc.at}
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
              <button
                onClick={() => setDeEscalateModal(true)}
                className="px-4 py-2 rounded-full bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-rose-100 hover:bg-rose-500 transition-all"
              >
                DE-ESCALATE
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#eff4f9]">
        {(job.is_qty_changed || job.is_date_changed) && (
          <div className="mb-6 space-y-3">
            {job.is_qty_changed && (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-purple-50 border border-purple-100 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Package className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h6 className="text-[11px] font-black text-purple-900 uppercase italic tracking-tight leading-none">Quantity Changed</h6>
                    <p className="text-[8px] font-black text-purple-400 uppercase tracking-widest mt-1">New Total Qty: {job.total_qty}</p>
                  </div>
                </div>
                {!isAssigned ? (
                  <button
                    onClick={() => handleClearFlag('qty')}
                    className="px-4 py-1.5 rounded-full bg-[#9333ea] text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-purple-100 hover:bg-[#7e22ce] transition-all"
                  >
                    ACKNOWLEDGE
                  </button>
                ) : (
                  <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest italic bg-purple-100/50 px-3 py-1 rounded-full">
                    Awaiting Operator ACK
                  </span>
                )}
              </div>
            )}
            {job.is_date_changed && (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 border border-amber-100 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h6 className="text-[11px] font-black text-amber-900 uppercase italic tracking-tight leading-none">Delivery Date Preponed</h6>
                    <p className="text-[8px] font-black text-amber-400 uppercase tracking-widest mt-1">New Date: {job.job_completion_date}</p>
                  </div>
                </div>
                {!isAssigned ? (
                  <button
                    onClick={() => handleClearFlag('date')}
                    className="px-4 py-1.5 rounded-full bg-[#d97706] text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-amber-100 hover:bg-[#b45309] transition-all"
                  >
                    ACKNOWLEDGE
                  </button>
                ) : (
                  <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest italic bg-amber-100/50 px-3 py-1 rounded-full">
                    Awaiting Operator ACK
                  </span>
                )}
              </div>
            )}
          </div>
        )}
        <section className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-4 h-4 text-orange-400 fill-orange-400" />
            <span className="text-[10px] font-black text-[#5c6d82] uppercase tracking-widest">{(job.process_name || 'UV PRINTING').toUpperCase()} PROGRESS</span>
          </div>

          <div className="space-y-4">
            {Object.values(job.material_groups?.filter(mg =>
              mg.materials?.some(m => {
                const cat = m.category_type?.toLowerCase() || "";
                return !cat.includes('consumable') && !cat.includes('hardware');
              })
            ).reduce((acc, mg) => {
              // Use _id as key so each process_index entry gets its own card
              const key = String(mg._id) || mg.group_id;
              if (!acc[key]) acc[key] = { ...mg, totalProg: 0, count: 0 };
              acc[key].totalProg += (mg.progress || 0);
              acc[key].count += 1;
              return acc;
            }, {}) || {}).map((mg, idx) => {
              const displayProgress = Math.round(mg.totalProg / Math.max(mg.count, 1));
              return (
                <div key={idx} className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-[#1e293b] uppercase w-20 truncate">{mg.group_name}</span>
                  <div className="flex-1 h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#cbd5e1] transition-all duration-1000"
                      style={{ width: `${displayProgress}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-black text-[#1e293b] w-8 text-right">{displayProgress}%</span>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <h4 className="text-[10px] font-black text-[#64748b] tracking-widest uppercase whitespace-nowrap">ASSIGN ENTIRE JOB TO MACHINE</h4>
            <div className="h-[1px] flex-1 bg-gray-200"></div>
          </div>
          {(() => {
            const procName = job.process_name?.toLowerCase() || "";
            const globalShifts = [1, 2].filter(s => {
              if (procName.includes('mimaki')) {
                return s === 2;
              }
              if (procName.includes('handtop') || procName.includes('hantop')) {
                return s === 1;
              }
              return true;
            });

            return (
              <div className={`grid gap-3 ${globalShifts.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {globalShifts.map(s => {
                  const colors = {
                    1: "bg-[#10b981] border-[#10b981] text-white shadow-md",
                    2: "bg-[#6366f1] border-[#6366f1] text-white shadow-md"
                  };
                  const isActive = isShiftActive(job.assigned_shifts, s);
                  return (
                    <AssignButton
                      key={s}
                      label={s === 1 ? 'Hantop' : 'Mimaki'}
                      icon={s === 1 ? (
                        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-[#10b981]'}`} />
                      ) : (
                        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-[#6366f1]'}`} />
                      )}
                      onClick={() => !job.is_hold && onShiftClick(s, job.assigned_shifts?.[0], 'GLOBAL')}
                      isActive={isActive}
                      disabled={job.is_hold}
                      activeClass={colors[s]}
                    />
                  );
                })}
              </div>
            );
          })()}
        </section>


        <section>
          <div className="flex items-center gap-3 mb-6">
            <h4 className="text-[10px] font-black text-[#64748b] tracking-widest uppercase whitespace-nowrap">Assign by Line Item</h4>
            <div className="h-[1px] flex-1 bg-gray-200"></div>
          </div>
          <div className="space-y-4">
            {(() => {
              const grouped = job.material_groups?.reduce((acc, mg) => {
                // Use unique _id so same group_name with different process_index stays separate
                const key = String(mg._id) || mg.group_id;
                if (!acc[key]) {
                  acc[key] = {
                    ...mg,
                    total_process_qty: 0,
                    outsource_qty: 0,
                    inhouse_qty: 0,
                    process_qty: 0,
                    assigned_outsource_sheets: 0,
                    assigned_outsource_ups: 0,
                    outsource_assignments: [],
                    assigned_shifts: [],
                    totalProgress: 0,
                    instanceIds: []
                  };
                }
                acc[key].total_process_qty += (mg.process_qty || 0);
                acc[key].outsource_qty += (mg.outsource_qty || 0);
                acc[key].inhouse_qty += (mg.inhouse_qty || 0);
                acc[key].process_qty += (mg.process_qty || 0);
                acc[key].assigned_outsource_sheets += (mg.assigned_outsource_sheets || 0);
                acc[key].assigned_outsource_ups += (mg.assigned_outsource_ups || 0);
                acc[key].totalProgress += (mg.progress || 0);

                if (mg.outsource_assignments?.length > 0) {
                  acc[key].outsource_assignments = [...acc[key].outsource_assignments, ...mg.outsource_assignments];
                }
                if (mg.assigned_shifts?.length > 0) {
                  acc[key].assigned_shifts = [...new Set([...acc[key].assigned_shifts, ...mg.assigned_shifts])];
                }
                acc[key].instanceIds.push(mg._id);

                if (mg.vendor_name) {
                  acc[key].vendor_id = mg.vendor_id;
                  acc[key].vendor_name = mg.vendor_name;
                  acc[key].outsource_rate = mg.outsource_rate;
                  acc[key].outsource_delivery_date = mg.outsource_delivery_date;
                }
                return acc;
              }, {});

              return Object.values(grouped || {}).map((mg, idx) => {
                // Use _id for all action callbacks to unambiguously target this entry
                const groupKey = mg._id || mg.group_id;
                const hasPrintableMaterial = mg.materials?.some(m => {
                  const cat = m.category_type?.toLowerCase() || "";
                  return !cat.includes('consumable') && !cat.includes('hardware');
                });

                if (!hasPrintableMaterial) return null;

                const m = mg.materials?.find(m => {
                  const cat = m.category_type?.toLowerCase() || "";
                  return !cat.includes('consumable') && !cat.includes('hardware');
                });

                const totalMaterialSheets = m?.quantity || 0;

                const upsPerSheet = m?.material_input?.ups || 1;

                const bom = job?.bom_id;
                let processesList = [];
                if (bom && bom.materialprocess) {
                  const processGroup = bom.materialprocess.find(p =>
                    p.material_group_name?.toLowerCase().trim() === mg.group_name?.toLowerCase().trim() ||
                    String(p.material_group_id) === String(mg._id || mg.group_id)
                  );
                  if (processGroup) {
                    processesList = processGroup.processes || [];
                  }
                }
                const cuttingIndex = processesList.findIndex(p =>
                  p.process_name?.toLowerCase().includes("laser") ||
                  p.process_name?.toLowerCase().includes("cutting") ||
                  p.process_name?.toLowerCase().includes("cut")
                );
                const currentProcessIndex = processesList.findIndex(p =>
                  p.process_name?.toLowerCase().trim() === job?.process_name?.toLowerCase().trim()
                );
                const isSubsequent = cuttingIndex !== -1 && currentProcessIndex !== -1 && currentProcessIndex > cuttingIndex;
                const isSheetMaterial = m?.material_type?.toLowerCase() === 'sheet';

                const totalPieces = m
                  ? (isSheetMaterial
                    ? (isSubsequent ? (job.total_qty || 0) : (mg.process_qty || job.total_qty || 0))
                    : (job.total_qty || 0))
                  : (job.total_qty || 0);

                const assignedSheets = mg.assigned_outsource_sheets || 0;

                const getPieceDims = () => {
                  const isSheet = m?.material_type?.toLowerCase() === 'sheet';
                  if (!isSheet) {
                    if (mg.input?.length && mg.input?.width) {
                      return { l: mg.input.length, w: mg.input.width };
                    }
                    if (mg.input?.baselength && mg.input?.basewidth) {
                      return { l: mg.input.baselength, w: mg.input.basewidth };
                    }
                  } else {
                    if (m?.material_input?.one_up_length && m?.material_input?.one_up_width) {
                      return { l: m.material_input.one_up_length, w: m.material_input.one_up_width };
                    }
                    if (m?.material_input?.size) {
                      const parts = m.material_input.size.toLowerCase().split('x').map(p => parseFloat(p.replace(/[^0-9.]/g, '')) || 0);
                      if (parts.length >= 2) return { l: parts[0], w: parts[1] };
                    }
                  }
                  // Fallbacks
                  if (mg.input?.length && mg.input?.width) {
                    return { l: mg.input.length, w: mg.input.width };
                  }
                  if (mg.input?.baselength && mg.input?.basewidth) {
                    return { l: mg.input.baselength, w: mg.input.basewidth };
                  }
                  if (m?.material_input?.one_up_length && m?.material_input?.one_up_width) {
                    return { l: m.material_input.one_up_length, w: m.material_input.one_up_width };
                  }
                  return { l: 0, w: 0 };
                };

                const { l: pieceLength, w: pieceWidth } = getPieceDims();
                const pieceDimsStr = pieceLength && pieceWidth ? `${pieceLength}"x${pieceWidth}"` : '-';

                const sqInPerPiece = parseFloat(pieceLength) * parseFloat(pieceWidth) || 0;
                const sqInPerPieceStr = sqInPerPiece ? `${sqInPerPiece} sq.in` : '-';

                const avgProgress = mg.progress || 0;

                return (
                  <div key={idx} className={`bg-white rounded-3xl border ${avgProgress === 100 ? 'border-green-200 bg-green-50/20' : 'border-gray-200'} p-6 shadow-sm transition-all hover:shadow-md`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex flex-col gap-1.5">
                          <h5 className="text-sm font-black text-[#0f172a] uppercase tracking-tight leading-none">{mg.group_name}</h5>
                          {(mg.bom_inhouse_qty > 0 || mg.bom_outsource_qty > 0) && (
                            <div className="mt-1 flex items-center gap-2">
                              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-widest italic">
                                BOM PLAN: {mg.bom_outsource_qty || 0} OUT / {mg.bom_inhouse_qty || 0} IN
                              </span>
                              <span className="text-[10px] font-black text-gray-300">|</span>
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
                                TOTAL: {mg.process_qty || mg.total_process_qty || 0} UNITS
                              </span>
                            </div>
                          )}
                          {(() => {
                            if (!m) return null;

                            let totalSqInch = 0;
                            if (m.material_type?.toLowerCase() === "sheet" && m.material_input?.size) {
                              const dims = m.material_input.size.toLowerCase().split('x').map(d => parseFloat(d.replace(/[^0-9.]/g, '')) || 0);
                              if (dims.length >= 2) totalSqInch = dims[0] * dims[1] * (m.quantity || 1);
                            }
                            const formatSqInch = (val) => val > 1000 ? (val / 1000).toFixed(1) + 'k' : Math.round(val);

                            const totalOutput = totalPieces;
                            const totalOutputStr = `${totalOutput} pcs`;

                            const totalSqIn = sqInPerPiece * totalOutput;
                            const totalSqInStr = totalSqIn ? `${totalSqIn} sq.in` : '-';

                            const ratePerSqIn = mg.process_rate || mg.rate || 0;
                            const ratePerSqInStr = `₹${parseFloat(ratePerSqIn).toFixed(2)}`;

                            const ratePerUnit = sqInPerPiece * ratePerSqIn;
                            const ratePerUnitStr = `₹${parseFloat(ratePerUnit).toFixed(2)}`;

                            const estValue = totalSqIn * ratePerSqIn;
                            const estValueStr = `₹${Math.round(estValue)}`;

                            return (
                              <div className="mt-1">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic leading-none mb-4">
                                  {m.material_type?.toLowerCase() === "sheet" && m.material_input
                                    ? `${m.material_input.size} · ${job.total_qty || 0} units · ${totalSqInch ? `${formatSqInch(totalSqInch)} sq.in` : ''} ${m.material_input.one_up_length ? `· ${m.material_input.one_up_length}x${m.material_input.one_up_width}in` : ''}`
                                    : `${m.quantity || mg.process_qty || job.total_qty || ''} · ${m.material_input?.unit || m.unit || ''}`}
                                  {mg.process_index ? ` · IDX ${mg.process_index}` : `\x27\x27`}
                                </p>

                                <div className="w-full p-5 rounded-[24px] bg-[#f0fdfa] border border-[#2dd4bf] mb-4 shadow-sm">
                                  <div className="grid grid-cols-3 gap-y-4 gap-x-8">
                                    <div className="space-y-1">
                                      <span className="block text-[9px] font-black text-[#0d9488] uppercase tracking-widest leading-none">PIECE DIMS</span>
                                      <span className="block text-[13px] font-black text-slate-800 leading-none">{pieceDimsStr}</span>
                                    </div>
                                    <div className="space-y-1">
                                      <span className="block text-[9px] font-black text-[#0d9488] uppercase tracking-widest leading-none">SQ.IN/PIECE</span>
                                      <span className="block text-[13px] font-black text-slate-800 leading-none">{sqInPerPieceStr}</span>
                                    </div>
                                    <div className="space-y-1">
                                      <span className="block text-[9px] font-black text-[#0d9488] uppercase tracking-widest leading-none">TOTAL SQ.IN</span>
                                      <span className="block text-[13px] font-black text-slate-800 leading-none">{totalSqInStr}</span>
                                    </div>

                                    <div className="space-y-1">
                                      <span className="block text-[9px] font-black text-[#0d9488] uppercase tracking-widest leading-none">RATE/SQ.IN</span>
                                      <span className="block text-[13px] font-black text-slate-800 leading-none">{ratePerSqInStr}</span>
                                    </div>
                                    <div className="space-y-1">
                                      <span className="block text-[9px] font-black text-[#0d9488] uppercase tracking-widest leading-none">EST. VALUE</span>
                                      <span className="block text-[13px] font-black text-slate-800 leading-none">{estValueStr}</span>
                                    </div>
                                    <div className="space-y-1">
                                      <span className="block text-[9px] font-black text-[#0d9488] uppercase tracking-widest leading-none">TOTAL OUTPUT</span>
                                      <span className="block text-[13px] font-black text-slate-800 leading-none">{totalOutputStr}</span>
                                    </div>
                                    <div className="space-y-1">
                                      <span className="block text-[9px] font-black text-[#0d9488] uppercase tracking-widest leading-none">RATE/UNIT</span>
                                      <span className="block text-[13px] font-black text-slate-800 leading-none">{ratePerUnitStr}</span>
                                    </div>

                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      {avgProgress === 100 && (
                        <span className="text-[8px] font-black bg-green-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest italic">DONE</span>
                      )}
                    </div>

                    {(() => {
                      const procName = job.process_name?.toLowerCase() || "";
                      const availableShifts = [1, 2, 3].filter(s => {
                        if (procName.includes('mimaki')) {
                          return s === 2 || s === 3;
                        }
                        if (procName.includes('handtop')) {
                          return s === 1 || s === 3;
                        }
                        return true;
                      });

                      return (
                        <div className={`grid gap-2 mt-6 ${availableShifts.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                          {availableShifts.map(s => {
                            const isActive = mg.assigned_shifts?.includes(s);
                            let btnClass = "";
                            if (isActive) {
                              if (s === 1) btnClass = "bg-[#10b981] border-[#10b981] text-white shadow-md";
                              else if (s === 2) btnClass = "bg-[#6366f1] border-[#6366f1] text-white shadow-md";
                              else btnClass = "bg-[#ec4899] border-[#ec4899] text-white shadow-md";
                            } else {
                              btnClass = "border-gray-100 bg-white text-gray-400 hover:border-gray-200 hover:bg-gray-50";
                            }

                            return (
                              <button
                                key={s}
                                onClick={() => !job.is_hold && onShiftClick(s, mg.assigned_shifts?.[0], mg._id || mg.group_id)}
                                disabled={job.is_hold}
                                className={`flex items-center justify-center gap-2 py-2.5 px-2 rounded-xl border text-[10px] font-black transition-all ${btnClass} ${job.is_hold ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {s === 1 && <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-[#10b981]'}`} />}
                                {s === 2 && <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-[#6366f1]'}`} />}
                                {s === 3 && <Factory className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#ec4899]'}`} />}
                                {s === 1 ? 'Hantop' : s === 2 ? 'Mimaki' : 'Out'}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* QTY SPLIT display — shown once outsource is assigned */}
                    {((mg.outsource_assignments?.length > 0) || (mg.vendor_name && mg.assigned_outsource_sheets > 0)) && (() => {
                      const assignedPieces = (mg.outsource_assignments || []).reduce((sum, a) => sum + (parseFloat(a.outsource_qty) || 0), 0);

                      const activeShifts = Array.isArray(mg.assigned_shifts)
                        ? mg.assigned_shifts.filter(s => s !== 3)
                        : [];

                      const shiftColors = {
                        1: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', icon: 'text-emerald-500', pill: 'bg-emerald-50 border-emerald-100 text-emerald-600' }, // Hantop
                        2: { bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-700', icon: 'text-indigo-500', pill: 'bg-indigo-50 border-indigo-100 text-indigo-600' }, // Mimaki
                      };

                      return (
                        <div className="mt-5 rounded-2xl border border-purple-100 bg-purple-50/40 overflow-hidden">
                          {/* Header */}
                          <div className="px-4 py-2 bg-purple-100/50 border-b border-purple-100">
                            <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">
                              QTY SPLIT — {totalPieces.toLocaleString()} PIECES
                            </span>
                          </div>

                          <div className="px-4 py-3">
                            {/* Outsource Assignments List */}
                            {(mg.outsource_assignments?.length > 0 ? mg.outsource_assignments : (mg.vendor_name ? [{
                              vendor_id: mg.vendor_id,
                              vendor_name: mg.vendor_name,
                              outsource_rate: mg.outsource_rate,
                              outsource_sheets: mg.assigned_outsource_sheets,
                              outsource_qty: mg.assigned_outsource_ups,
                              outsource_delivery_date: mg.outsource_delivery_date
                            }] : [])).map((assignment, aIdx) => (
                              <div key={aIdx} className="mb-4 last:mb-0 pb-4 border-b border-slate-100 last:border-0">
                                {/* Pieces Row */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 w-28 flex-shrink-0">
                                      <Factory className="w-3 h-3 text-purple-400" />
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">OUTSOURCE</span>
                                    </div>
                                    <div className="px-4 py-1.5 rounded-xl bg-purple-100 border border-purple-200 text-[11px] font-black text-purple-700 min-w-[70px] text-center">
                                      {(assignment.outsource_qty || 0).toLocaleString()} pieces
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 italic">of {totalPieces.toLocaleString()} pieces</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => !job.is_hold && (() => {
                                        setOutsourceForm({
                                          vendor_id: assignment.vendor_id,
                                          vendor_name: assignment.vendor_name,
                                          outsource_rate: assignment.outsource_rate || "",
                                          outsource_sheets: assignment.outsource_qty || "",
                                          outsource_qty: assignment.outsource_qty || "",
                                          outsource_delivery_date: assignment.outsource_delivery_date || "",
                                          communication_mode: assignment.communication_mode || "whatsapp_and_email"
                                        });
                                        setOutsourceMode({ show: true, groupId: mg._id || mg.group_id, group: mg, editIndex: aIdx });
                                      })()}
                                      disabled={job.is_hold}
                                      className={`px-2 py-1 rounded-lg bg-purple-50 text-purple-600 text-[9px] font-black uppercase transition-all border border-purple-100 ${job.is_hold ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-100'}`}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => !job.is_hold && removeOutsource(mg._id || mg.group_id, aIdx)}
                                      disabled={job.is_hold}
                                      className={`px-2 py-1 rounded-lg bg-rose-50 text-rose-600 text-[9px] font-black uppercase transition-all border border-rose-100 ${job.is_hold ? 'opacity-50 cursor-not-allowed' : 'hover:bg-rose-100'}`}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>

                                {/* Vendor Info Row */}
                                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-500 uppercase tracking-tight">
                                      <Factory className="w-2.5 h-2.5" /> {assignment.vendor_name}
                                    </span>
                                    {assignment.outsource_rate > 0 && (
                                      <>
                                        <span className="text-slate-200">|</span>
                                        <span className="text-[10px] font-bold text-indigo-500 tracking-tight">₹{assignment.outsource_rate}/sq. in</span>
                                      </>
                                    )}
                                    {assignment.outsource_delivery_date && (
                                      <>
                                        <span className="text-slate-200">|</span>
                                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-400 tracking-tight">
                                          <Clock className="w-2.5 h-2.5" /> {assignment.outsource_delivery_date}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  {assignment.outsource_rate > 0 && (() => {
                                    const qty = parseFloat(assignment.outsource_qty) || 0;
                                    const rate = parseFloat(assignment.outsource_rate) || 0;
                                    const totalSqIn = qty * sqInPerPiece;
                                    const totalCost = totalSqIn * rate;
                                    return (
                                      <span className="text-[10px] font-black text-purple-700 tracking-tight">
                                        Total Sq.In Rate: ₹{Math.round(totalCost)}
                                      </span>
                                    );
                                  })()}
                                </div>
                              </div>
                            ))}

                            {/* Add Vendor Button */}
                            {(() => {
                              const currentInhousePieces = mg.inhouse_qty || 0;
                              const liveInhousePieces = getShiftPieces(groupKey, 'combined', currentInhousePieces);
                              const totalAssignedSoFar = assignedPieces + liveInhousePieces;
                              const remainingToAllocate = Math.max(0, totalPieces - assignedPieces);

                              const groupShifts = mg.assigned_shifts?.filter(s => s !== 3) || [];
                              if (totalAssignedSoFar >= totalPieces || groupShifts.length > 0 || outsourceMode.show) return null;

                              return (
                                <button
                                  onClick={() => {
                                    setOutsourceForm({
                                      vendor_id: "",
                                      vendor_name: "",
                                      outsource_rate: "",
                                      outsource_qty: Math.max(0, remainingToAllocate),
                                      outsource_sheets: Math.max(0, remainingToAllocate),
                                      outsource_delivery_date: "",
                                      communication_mode: "whatsapp_and_email"
                                    });
                                    setOutsourceMode({ show: true, groupId: mg._id || mg.group_id, group: mg, editIndex: null });
                                  }}
                                  className="w-full mt-2 py-2.5 rounded-xl border-2 border-dashed border-purple-200 text-purple-400 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
                                >
                                  <span className="text-[9px] font-black uppercase tracking-widest">+ Add Vendor</span>
                                </button>
                              );
                            })()}

                            {/* Shift Row — combined with editable remaining qty */}
                            {activeShifts.length > 0 && (() => {
                              const remainingPieces = Math.max(0, totalPieces - assignedPieces);
                              const groupKey = mg._id || mg.group_id;
                              const shiftInput = getShiftPieces(groupKey, 'combined', remainingPieces);
                              const isFullyAllocated = totalPieces > 0 && (assignedPieces + shiftInput) >= totalPieces;
                              return (
                                <div>
                                  {/* Shift label + input row */}
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 w-28 flex-shrink-0 flex-wrap">
                                      {activeShifts.map(s => {
                                        const c = shiftColors[s] || shiftColors[1];
                                        return (
                                          <div key={s} className={`flex items-center gap-1 px-2 py-0.5 rounded ${c.pill}`}>
                                            <Circle className="w-2.5 h-2.5 fill-current" />
                                            <span className="text-[8px] font-black uppercase tracking-tight">{s === 1 ? 'Hantop' : 'Mimaki'}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <input
                                      type="number"
                                      value={shiftInput}
                                      onChange={(e) => {
                                        const raw = parseFloat(e.target.value);
                                        if (isNaN(raw)) { setShiftPieces(groupKey, 'combined', ''); return; }
                                        setShiftPieces(groupKey, 'combined', Math.min(Math.max(0, raw), remainingPieces));
                                      }}
                                      placeholder="0"
                                      className={`w-[70px] px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-100 text-[11px] font-black text-blue-700 text-center outline-none focus:ring-2 focus:ring-blue-200 transition-all ${job.is_hold ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                    <span className="text-[10px] font-bold text-slate-400 italic">of {totalPieces.toLocaleString()} pieces</span>
                                  </div>
                                  {/* FULLY ALLOCATED badge */}
                                  {isFullyAllocated && (
                                    <div className="flex items-center gap-2 px-3 py-2 mt-2 rounded-xl bg-green-50 border border-green-100">
                                      <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                                      <span className="text-[9px] font-black text-green-700 uppercase tracking-tight">
                                        FULLY ALLOCATED — {assignedPieces.toLocaleString()} PCS OUTSOURCE + {shiftInput.toLocaleString()} PCS SHIFT
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>

                          {/* Footer: Combined Shift pill */}
                          <div className="px-4 pb-3 flex flex-wrap gap-2">
                            {activeShifts.length > 0 && (() => {
                              const groupKey = mg._id || mg.group_id;
                              const remainingPieces = Math.max(0, totalPieces - assignedPieces);
                              const shiftInput = getShiftPieces(groupKey, 'combined', remainingPieces);
                              return (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-blue-100 shadow-sm">
                                  <div className="flex items-center gap-1">
                                    {activeShifts.map(s => {
                                      const c = shiftColors[s] || shiftColors[1];
                                      return <Circle key={s} className={`w-3 h-3 fill-current ${c.icon}`} />;
                                    })}
                                  </div>
                                  <span className="text-[10px] font-black uppercase italic tracking-tight text-blue-600">
                                    {activeShifts.map(s => s === 1 ? 'Hantop' : 'Mimaki').join(' ')}
                                    {shiftInput > 0 ? ` (${shiftInput.toLocaleString()} Pcs)` : ''}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Outsource Form */}
                    {outsourceMode.show && String(outsourceMode.groupId) === String(mg._id || mg.group_id) && (() => {
                      const pieces = parseFloat(outsourceForm.outsource_qty) || 0;

                      const parseDateHelper = (dateStr) => {
                        if (!dateStr || typeof dateStr !== 'string') return null;
                        const parts = dateStr.split('-');
                        if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
                          return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                        }
                        return new Date(dateStr);
                      };

                      const d1 = parseDateHelper(outsourceForm.outsource_delivery_date);
                      const d2 = job.job_completion_date ? parseDateHelper(job.job_completion_date) : null;
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);

                      let dateError = null;
                      if (d1) {
                        if (d1 < today) {
                          dateError = "Outsource delivery date cannot be in the past";
                        } else if (d2) {
                          d1.setHours(0, 0, 0, 0);
                          d2.setHours(0, 0, 0, 0);
                          if (d1 > d2) {
                            dateError = `Outsource delivery date cannot be after finish-by date (${job.job_completion_date})`;
                          }
                        }
                      }

                      return (
                        <div className="mt-4 rounded-2xl bg-purple-50 border border-purple-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                          {/* Form Header */}
                          <div className="flex items-center gap-2 px-4 py-3 bg-purple-100/60 border-b border-purple-100">
                            <Factory className="w-3.5 h-3.5 text-purple-600" />
                            <h6 className="text-[10px] font-black text-purple-900 uppercase tracking-widest">OUTSOURCE — {mg.group_name}</h6>
                          </div>

                          <div className="p-4 space-y-3">
                            {/* Vendor */}
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest ml-1">SELECT VENDOR</label>
                              <select
                                value={outsourceForm.vendor_id}
                                onChange={(e) => {
                                  const v = vendors.find(v => v._id === e.target.value);
                                  setOutsourceForm({ ...outsourceForm, vendor_id: e.target.value, vendor_name: v?.name || '' });
                                }}
                                className="w-full p-2.5 rounded-xl border border-purple-200 bg-white text-[11px] font-bold outline-none shadow-sm focus:border-purple-400 transition-all"
                              >
                                <option value="">Select vendor...</option>
                                {getFilteredVendors().filter(v => {
                                  const currentAssignmentVendorId = outsourceMode.editIndex !== null
                                    ? mg.outsource_assignments?.[outsourceMode.editIndex]?.vendor_id
                                    : null;

                                  if (v._id === currentAssignmentVendorId) return true;

                                  const isAlreadyAssigned = mg.outsource_assignments?.some(a => a.vendor_id === v._id);
                                  return !isAlreadyAssigned;
                                }).map(v => (
                                  <option key={v._id} value={v._id}>{v.name}</option>
                                ))}
                              </select>
                            </div>

                            {/* Pieces Input */}
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest ml-1">PIECES TO OUTSOURCE</label>
                              <input
                                type="number"
                                value={outsourceForm.outsource_qty}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  const otherPieces = (mg.outsource_assignments || []).reduce((sum, a, idx) => {
                                    if (idx === outsourceMode.editIndex) return sum;
                                    return sum + (parseFloat(a.outsource_qty) || 0);
                                  }, 0);
                                  const maxAllowed = totalPieces - otherPieces;
                                  const finalVal = Math.min(val, maxAllowed);
                                  setOutsourceForm({
                                    ...outsourceForm,
                                    outsource_qty: e.target.value === '' ? '' : finalVal,
                                    outsource_sheets: e.target.value === '' ? '' : finalVal
                                  });
                                }}
                                placeholder={`Max: ${totalPieces - (mg.outsource_assignments || []).reduce((sum, a, idx) => idx === outsourceMode.editIndex ? sum : sum + (parseFloat(a.outsource_qty) || 0), 0)}`}
                                className="w-full p-2.5 rounded-xl border border-purple-200 bg-white text-[11px] font-bold outline-none focus:border-purple-400 transition-all"
                              />
                            </div>

                            {/* Rate + Date */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest ml-1">RATE / SQ. IN (₹)</label>
                                <input
                                  type="number"
                                  value={outsourceForm.outsource_rate}
                                  onChange={(e) => setOutsourceForm({ ...outsourceForm, outsource_rate: e.target.value })}
                                  placeholder="0.00"
                                  className="w-full p-2.5 rounded-xl border border-purple-200 bg-white text-[11px] font-bold outline-none focus:border-purple-400 transition-all"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest ml-1">DELIVERY DATE</label>
                                <input
                                  type="date"
                                  value={outsourceForm.outsource_delivery_date}
                                  onChange={(e) => setOutsourceForm({ ...outsourceForm, outsource_delivery_date: e.target.value })}
                                  className={`w-full p-2.5 rounded-xl border ${dateError ? 'border-red-400' : 'border-purple-200'} bg-white text-[11px] font-bold outline-none focus:border-purple-400 transition-all`}
                                />
                                {dateError && (
                                  <span className="text-[9px] font-black text-red-500 uppercase tracking-tighter">{dateError}</span>
                                )}
                              </div>
                            </div>

                            {/* Communication Mode */}
                            <div className="space-y-1 mb-3">
                              <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest ml-1">NOTIFY VENDOR VIA</label>
                              <select
                                value={outsourceForm.communication_mode}
                                onChange={(e) => setOutsourceForm({ ...outsourceForm, communication_mode: e.target.value })}
                                className="w-full p-2.5 rounded-xl border border-purple-200 bg-white text-[11px] font-bold outline-none focus:border-purple-400 transition-all shadow-sm"
                              >
                                <option value="whatsapp_and_email">WhatsApp & Email</option>
                                <option value="whatsapp">WhatsApp Only</option>
                                <option value="email">Email Only</option>
                              </select>
                            </div>

                            {/* Summary Line */}
                            {(pieces > 0 || outsourceForm.outsource_rate || outsourceForm.outsource_delivery_date) && (() => {
                              const rateVal = parseFloat(outsourceForm.outsource_rate) || 0;
                              const assignSqIn = pieces * sqInPerPiece;
                              const assignCost = assignSqIn * rateVal;
                              return (
                                <div className="px-3 py-2 rounded-xl bg-white border border-purple-100 text-[11px] font-black text-slate-500 tracking-tight flex justify-between items-center shadow-sm">
                                  <div>
                                    {pieces > 0 && <span className="text-purple-700">{pieces.toLocaleString()} pieces</span>}
                                    {outsourceForm.vendor_name && <span className="text-slate-400"> · {outsourceForm.vendor_name}</span>}
                                    {outsourceForm.outsource_rate && <span className="text-slate-400"> @ ₹{outsourceForm.outsource_rate}/sq. in</span>}
                                    {outsourceForm.outsource_delivery_date && <span className="text-slate-400"> · Del: {outsourceForm.outsource_delivery_date}</span>}
                                  </div>
                                  {assignCost > 0 && (
                                    <span className="text-[10px] font-black text-purple-700 tracking-tight shrink-0">
                                      Total Sq.In Rate: ₹{Math.round(assignCost)}
                                    </span>
                                  )}
                                </div>
                              );
                            })()}

                            {/* Actions */}
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => setOutsourceMode({ show: false, groupId: null, group: null, editIndex: null })}
                                className="flex-1 py-2.5 rounded-xl text-[9px] font-black text-purple-400 border border-purple-100 hover:bg-white transition-all"
                              >
                                CLOSE
                              </button>

                              {(() => {
                                const isFormInvalid = !outsourceForm.vendor_id ||
                                  !outsourceForm.outsource_qty ||
                                  !outsourceForm.outsource_rate ||
                                  !outsourceForm.outsource_delivery_date ||
                                  !!dateError;

                                return (
                                  <button
                                    onClick={() => submitOutsource(mg._id || mg.group_id)}
                                    disabled={isFormInvalid || isSubmitting}
                                    className={`flex-[2] py-2.5 rounded-xl text-white text-[9px] font-black uppercase tracking-widest shadow-lg transition-all ${(isFormInvalid || isSubmitting)
                                      ? 'bg-slate-300 shadow-none cursor-not-allowed opacity-60'
                                      : 'bg-purple-600 shadow-purple-100 hover:bg-purple-500 active:scale-95'
                                      }`}
                                  >
                                    {isSubmitting ? 'PROCESSING...' : '✓ CONFIRM'}
                                  </button>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              });
            })()}
          </div>
        </section>

        {/* Escalation & Hold History Section */}
        {/* <section className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2.5 mb-4">
            <h4 className="text-[12px] font-black text-[#64748b] tracking-widest uppercase whitespace-nowrap">
              Escalation & Hold History
            </h4>
            <div className="h-px flex-1 bg-gray-100" />
          </div>

          {job.escalation_hold_history && job.escalation_hold_history.length > 0 ? (
            <div className="flex flex-col gap-2">
              {job.escalation_hold_history.slice().reverse().map((hist, hIdx) => (
                <div
                  key={hIdx}
                  className={`flex flex-col gap-2 px-3 py-2.5 rounded-[10px] border transition-all
                                            ${hist.type === 'Escalated'
                      ? 'bg-red-50 border-red-200'
                      : hist.type === 'Hold'
                        ? 'bg-amber-50 border-amber-200'
                        : hist.type === 'Resume'
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-green-50 border-green-200'
                    }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0
                                                    ${hist.type === 'Escalated'
                          ? 'bg-red-200 text-red-700'
                          : hist.type === 'Hold'
                            ? 'bg-amber-200 text-amber-700'
                            : hist.type === 'Resume'
                              ? 'bg-blue-200 text-blue-700'
                              : 'bg-green-200 text-green-700'
                        }`}
                      >
                        {hist.type === 'Escalated' ? <Flag className="w-3.5 h-3.5" /> :
                          hist.type === 'Hold' ? <Clock className="w-3.5 h-3.5" /> :
                            hist.type === 'Resume' ? <Zap className="w-3.5 h-3.5" /> :
                              <CheckCircle className="w-3.5 h-3.5" />
                        }
                      </div>
                      <div>
                        <p className={`text-[11px] font-black uppercase tracking-wide leading-none
                                                        ${hist.type === 'Escalated' ? 'text-red-800' :
                            hist.type === 'Hold' ? 'text-amber-800' :
                              hist.type === 'Resume' ? 'text-blue-800' :
                                'text-green-800'}`}>
                          {hist.type}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{hist.at}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-full px-2.5 py-1 shrink-0">
                      <UserIcon className="w-3 h-3 text-gray-400" />
                      <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                        {hist.by?.name || 'Admin'}
                      </span>
                    </div>
                  </div>

                  {hist.remarks && (
                    <div className="pl-9 pr-2">
                      <p className={`text-[10px] font-bold italic leading-tight
                                                    ${hist.type === 'Escalated' ? 'text-red-600' :
                          hist.type === 'Hold' ? 'text-amber-600' :
                            hist.type === 'Resume' ? 'text-blue-600' :
                              'text-green-600'}`}>
                        "{hist.remarks}"
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 rounded-2xl bg-gray-50 border border-dashed border-gray-100">
              <Clock className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest italic">
                No Escalation & Hold Logs
              </p>
            </div>
          )}
        </section> */}
      </div>

      <div className="p-4 bg-[#0a101f] text-white flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-[8px] font-black tracking-[0.2em] uppercase opacity-40 mb-1">TOTAL AREA</span>
          <span className="text-sm font-black italic tracking-tighter uppercase text-cyan-400">
            {(() => {
              let total = 0;
              job.material_groups?.forEach(mg => {
                mg.materials?.forEach(m => {
                  const isConsumable = m.category_type?.toLowerCase() === "consumable" || m.category_type?.toLowerCase() === "hardware";
                  if (!isConsumable && m.material_type === "sheet" && m.material_input?.size) {
                    const dims = m.material_input.size.toLowerCase().split('x').map(d => parseFloat(d.replace(/[^0-9.]/g, '')) || 0);
                    if (dims.length >= 2) {
                      total += dims[0] * dims[1] * (m.quantity || 1);
                    }
                  }
                });
              });
              return total > 1000 ? (total / 1000).toFixed(1) + 'k' : Math.round(total);
            })()} <span className="text-[10px] not-italic opacity-60 ml-0.5">SQ.IN</span>
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[8px] font-black tracking-[0.2em] uppercase opacity-40 mb-1 text-right">STATUS</span>
          <span className="text-sm font-black italic tracking-tighter uppercase">{job.status}</span>
        </div>
      </div>

      <ReassignModal
        show={reassignModal.show}
        onClose={() => setReassignModal({ show: false, newShift: null, currentShift: null, groupId: null })}
        onConfirm={submitReassignment}
        remark={reassignRemark}
        setRemark={setReassignRemark}
        newShift={reassignModal.newShift}
        currentShift={reassignModal.currentShift}
        isUv={true}
      />

      <ConfirmationModal
        isOpen={warningModal.show}
        onClose={() => setWarningModal({ show: false, message: "" })}
        onConfirm={() => setWarningModal({ show: false, message: "" })}
        title="Action Required"
        message={warningModal.message}
        confirmText="Got it"
        confirmColor="bg-purple-600 hover:bg-purple-700"
      />

      <ConfirmationModal
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, groupId: null, index: null })}
        onConfirm={confirmRemove}
        title="Remove Vendor?"
        message="Are you sure you want to remove this outsource assignment? This action cannot be undone."
        confirmText="Remove"
        confirmColor="bg-rose-500 hover:bg-rose-600"
      />

      {/* Escalation Modal */}
      <ConfirmationModal
        isOpen={escalateModal}
        onClose={() => setEscalateModal(false)}
        onConfirm={handleEscalate}
        title={`Escalate Job - ${job.sub_job_no}`}
        message="Are you sure you want to escalate this job for management attention?"
        confirmText="ESCALATE"
        confirmColor="bg-rose-600 shadow-rose-100"
      />

      {/* De-Escalation Modal */}
      <ConfirmationModal
        isOpen={deEscalateModal}
        onClose={() => setDeEscalateModal(false)}
        onConfirm={handleDeEscalate}
        title={`De-Escalate Job - ${job.sub_job_no}`}
        message="Are you sure you want to de-escalate this job?"
        confirmText="DE-ESCALATE"
        confirmColor="bg-emerald-600 shadow-emerald-100"
      />
    </div>
  );
};

const AssignButton = ({ label, icon, onClick, isActive, activeClass, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-all group ${isActive ? activeClass : 'border-gray-200 bg-white shadow-sm hover:border-cyan-500 hover:shadow-md'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <div>{icon}</div>
    <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-gray-700'}`}>{label}</span>
  </button>
);

export default UvJobDetail;
