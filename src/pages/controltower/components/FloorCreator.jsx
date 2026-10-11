import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { getAllProcesses } from '../../../reducer/processReducer';
import { fetchAllRateUnits } from '../../../reducer/inventory/common/rateUnitReducer';
import { getAllRoles } from '../../../reducer/roleReducer';
import { createControlTowerDept, updateControlTowerDept } from '../../../reducer/controlTowerReducer';

const ICONS = ['🏭', '⚙️', '🖨️', '✂️', '🧪', '🎨', '🔧', '📦', '🔍', '💡', '🌡️', '✨', '🛸', '📬', '🚚', '💰', '🗃️', '🖥️', '🔐'];

// Process names to skip in the dropdown
const SKIP_PROCESSES = ['dtp', 'laser', 'uv'];

// Role names to skip in the supervisor & operators dropdowns
const SKIP_ROLES = ['laser', 'uv', 'dtp', 'design', 'client servicing', 'admin', 'accounts', 'production', 'marketing'];

export default function FloorCreator({ onClose, editFloor, onSaved }) {
  const dispatch = useDispatch();
  const { processes } = useSelector((state) => state.process);
  const { rateUnits } = useSelector((state) => state.rateUnit);
  const { roles } = useSelector((state) => state.role);
  const { depts: backendFloors } = useSelector((state) => state.controlTower);

  const isEdit = !!editFloor;

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🖥️');
  const [accent, setAccent] = useState('#0D9488');
  const [pattern, setPattern] = useState('A');
  const [isActive, setIsActive] = useState(true);

  // Step 2
  const [primaryVarId, setPrimaryVarId] = useState('');
  const [selectedProcesses, setSelectedProcesses] = useState([]);
  const [processSelect, setProcessSelect] = useState('');
  const [machines, setMachines] = useState([]);
  const [machineInput, setMachineInput] = useState('');
  const [subStages, setSubStages] = useState([]);
  const [stepInput, setStepInput] = useState('');

  // Step 3
  const [supervisorId, setSupervisorId] = useState('');
  const [operatorId, setOperatorId] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Fetch masters on mount
  useEffect(() => {
    dispatch(getAllProcesses({ is_active: true, params: {} }));
    dispatch(fetchAllRateUnits({ is_active: true }));
    dispatch(getAllRoles({ is_active: true, params: {} }));
  }, [dispatch]);

  // Pre-fill form if editing
  useEffect(() => {
    if (editFloor) {
      setName(editFloor.name || '');
      setIcon(editFloor.icon || '🖥️');
      setAccent(editFloor.accent || '#0D9488');
      setPattern(editFloor.pattern || 'A');
      setIsActive(editFloor.is_active !== undefined ? editFloor.is_active : true);

      // Processes — comes populated as array of { _id, id, name }
      if (editFloor.processes && editFloor.processes.length > 0) {
        setSelectedProcesses(editFloor.processes.map((p) => ({
          _id: p._id,
          id: p.id || p._id,
          name: p.name
        })));
      }

      // Primary variable — comes populated as { _id, id, name, symbol }
      if (editFloor.primary_variable) {
        setPrimaryVarId(editFloor.primary_variable._id || editFloor.primary_variable);
      }

      setMachines(editFloor.machines || []);
      setSubStages(editFloor.sub_stages || []);

      // Supervisors — populated
      if (editFloor.supervisors && editFloor.supervisors.length > 0) {
        const sup = editFloor.supervisors[0];
        setSupervisorId(sup._id || sup.id || sup);
      }

      // Operators — populated
      if (editFloor.operators && editFloor.operators.length > 0) {
        const op = editFloor.operators[0];
        setOperatorId(op._id || op.id || op);
      }
    }
  }, [editFloor]);

  // Filter processes: skip dtp/laser/uv, only active, and not assigned to other floors
  const filteredProcesses = (processes || []).filter((p) => {
    if (!p.is_active) return false;
    const n = (p.name || '').toLowerCase();
    if (SKIP_PROCESSES.some((skip) => n.includes(skip))) return false;

    // Check if this process is already assigned to another floor
    const isAssignedToOtherFloor = (backendFloors || []).some((floor) => {
      // If we are editing, skip the current floor
      if (isEdit && (floor._id === editFloor?._id || floor.id === editFloor?.id)) {
        return false;
      }
      return (floor.processes || []).some((fp) => {
        const fpId = typeof fp === 'object' ? (fp._id || fp.id) : fp;
        return String(fpId) === String(p._id);
      });
    });

    return !isAssignedToOtherFloor;
  });

  // Active rate units
  const activeRateUnits = (rateUnits || []).filter((r) => r.is_active !== false);

  // Active roles
  const activeRoles = (roles || []).filter((r) => {
    if (r.is_active === false) return false;
    const nameLower = (r.name || '').toLowerCase();
    return !SKIP_ROLES.some((skip) => nameLower.includes(skip));
  });

  const moveProcess = (index, direction) => {
    const newOrder = [...selectedProcesses];
    const targetIndex = index + direction;
    if (targetIndex >= 0 && targetIndex < newOrder.length) {
      const temp = newOrder[index];
      newOrder[index] = newOrder[targetIndex];
      newOrder[targetIndex] = temp;
      setSelectedProcesses(newOrder);
    }
  };

  const moveMachine = (index, direction) => {
    const newOrder = [...machines];
    const targetIndex = index + direction;
    if (targetIndex >= 0 && targetIndex < newOrder.length) {
      const temp = newOrder[index];
      newOrder[index] = newOrder[targetIndex];
      newOrder[targetIndex] = temp;
      setMachines(newOrder);
    }
  };

  const moveSubStage = (index, direction) => {
    const newOrder = [...subStages];
    const targetIndex = index + direction;
    if (targetIndex >= 0 && targetIndex < newOrder.length) {
      const temp = newOrder[index];
      newOrder[index] = newOrder[targetIndex];
      newOrder[targetIndex] = temp;
      setSubStages(newOrder);
    }
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (index, type) => {
    if (draggedIndex === null || draggedIndex === index) return;

    if (type === 'process') {
      const items = [...selectedProcesses];
      const draggedItem = items[draggedIndex];
      items.splice(draggedIndex, 1);
      items.splice(index, 0, draggedItem);
      setSelectedProcesses(items);
    } else if (type === 'machine') {
      const items = [...machines];
      const draggedItem = items[draggedIndex];
      items.splice(draggedIndex, 1);
      items.splice(index, 0, draggedItem);
      setMachines(items);
    } else if (type === 'subStage') {
      const items = [...subStages];
      const draggedItem = items[draggedIndex];
      items.splice(draggedIndex, 1);
      items.splice(index, 0, draggedItem);
      setSubStages(items);
    }

    setDraggedIndex(null);
  };

  // Handlers
  const handleAddMachine = () => {
    if (machineInput.trim() && !machines.includes(machineInput.trim())) {
      setMachines([...machines, machineInput.trim()]);
      setMachineInput('');
    }
  };

  const handleAddStep = () => {
    if (stepInput.trim() && !subStages.includes(stepInput.trim())) {
      setSubStages([...subStages, stepInput.trim()]);
      setStepInput('');
    }
  };

  const handleNextStep1 = () => {
    setSubmitError('');
    if (!name.trim()) {
      setSubmitError('Please enter a floor name.');
      return;
    }

    const trimmedName = name.trim().toUpperCase();
    const isDefaultName = ['LASER CUTTING STUDIO', 'UV PRINTING STUDIO', 'DTP PRE-PRESS', 'ASSEMBLY BAY'].includes(trimmedName) ||
      trimmedName.startsWith('LASER') || trimmedName.startsWith('UV') || trimmedName === 'DTP' || trimmedName === 'DTP PRE-PRESS' || trimmedName.startsWith('ASSEMBLY');

    const rawFloors = backendFloors || [];
    const isExistingBackendName = rawFloors.some((f) => {
      if (isEdit && (f.id === editFloor?.id || f._id === editFloor?._id || f._id === editFloor?.id)) {
        return false;
      }
      return (f.name || '').trim().toUpperCase() === trimmedName;
    });

    if (isDefaultName || isExistingBackendName) {
      const errMsg = 'Floor name already exists';
      setSubmitError(errMsg);
      // toast.error(errMsg);
      return;
    }

    setStep(2);
  };

  async function handleSubmit() {
    setSubmitError('');
    if (!name.trim()) {
      setSubmitError('Please enter a floor name.');
      return;
    }

    const trimmedName = name.trim().toUpperCase();
    const isDefaultName = ['LASER CUTTING STUDIO', 'UV PRINTING STUDIO', 'DTP PRE-PRESS', 'ASSEMBLY BAY'].includes(trimmedName) ||
      trimmedName.startsWith('LASER') || trimmedName.startsWith('UV') || trimmedName === 'DTP' || trimmedName === 'DTP PRE-PRESS' || trimmedName.startsWith('ASSEMBLY');

    const rawFloors = backendFloors || [];
    const isExistingBackendName = rawFloors.some((f) => {
      if (isEdit && (f.id === editFloor?.id || f._id === editFloor?._id || f._id === editFloor?.id)) {
        return false;
      }
      return (f.name || '').trim().toUpperCase() === trimmedName;
    });

    if (isDefaultName || isExistingBackendName) {
      const errMsg = 'floorname already exists';
      setSubmitError(errMsg);
      toast.error(errMsg);
      return;
    }
    if (selectedProcesses.length === 0) {
      setSubmitError('Please select at least one process.');
      return;
    }
    if (!primaryVarId) {
      setSubmitError('Please select a primary variable.');
      return;
    }
    if (machines.length === 0) {
      setSubmitError('Please add at least one machine / kanban.');
      return;
    }
    // Removed sub-stages length check as it is now optional
    if (!supervisorId) {
      setSubmitError('Please select a supervisor.');
      return;
    }
    if (!operatorId) {
      setSubmitError('Please select an operator.');
      return;
    }

    setSubmitting(true);

    const payload = {
      name,
      icon,
      accent,
      pattern,
      is_active: isActive,
      processes: selectedProcesses.map((p) => p._id),
      primary_variable: primaryVarId || null,
      machines,
      sub_stages: pattern === 'A' ? [] : subStages,
      supervisors: supervisorId ? [supervisorId] : [],
      operators: operatorId ? [operatorId] : [],
    };

    try {
      if (isEdit) {
        await dispatch(updateControlTowerDept({ id: editFloor.id, formData: payload })).unwrap();
        toast.success('Shop floor updated successfully.');
      } else {
        await dispatch(createControlTowerDept(payload)).unwrap();
        toast.success('Shop floor created successfully.');
      }
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      const errMsg = typeof err === 'string' ? err : (err.message || 'Operation failed.');
      setSubmitError(errMsg);
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Shared styles ──
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '900', color: '#475569', letterSpacing: '0.5px', marginBottom: '8px' };
  const inputStyle = { width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '14px', color: '#0F172A', outline: 'none' };
  const selectStyle = { ...inputStyle, cursor: 'pointer' };
  const addBtnStyle = (enabled) => ({ padding: '12px 16px', background: enabled ? '#0D9488' : '#CBD5E1', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: enabled ? 'pointer' : 'not-allowed' });
  const chipStyle = { display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#E2E8F0', color: '#475569', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' };
  const chipRemoveStyle = { background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '14px', padding: 0 };

  const isValidSupervisor = activeRoles.some((r) => r._id === supervisorId);
  const isValidOperator = activeRoles.some((r) => r._id === operatorId);

  return (
    <div
      className="ct-backdrop"
      style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
    >
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '560px', background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* HEADER */}
        <div style={{ background: '#0F172A', padding: '20px 24px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1E293B', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '900', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              {isEdit ? '✏️ EDIT SHOP FLOOR' : '+ CREATE NEW SHOP FLOOR'}
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700', marginTop: '2px' }}>
              Step {step} of 3
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '26px', cursor: 'pointer', lineHeight: 1, padding: '4px' }}>×</button>
        </div>

        {/* BODY */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }} className='scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50 scroll-auto'>
          {submitError && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚠️</span>
              <span>{submitError}</span>
            </div>
          )}

          {/* ────────── STEP 1 ────────── */}
          {step === 1 && (
            <div>
              {/* FLOOR NAME */}
              <div style={{ marginBottom: '18px' }}>
                <label style={labelStyle}>FLOOR NAME *</label>
                <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Embroidery Studio" />
              </div>

              {/* PROCESS SELECT */}
              <div style={{ marginBottom: '18px' }}>
                <label style={labelStyle}>PROCESS *</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <select value={processSelect} onChange={(e) => setProcessSelect(e.target.value)} style={{ ...selectStyle, flex: 1, color: processSelect ? '#0F172A' : '#94A3B8' }}>
                    <option value="">— Select a process —</option>
                    {filteredProcesses.filter((p) => !selectedProcesses.find((sp) => sp._id === p._id)).map((p) => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                  <button type="button" disabled={!processSelect} onClick={() => {
                    const proc = filteredProcesses.find((p) => p._id === processSelect);
                    if (proc) {
                      setSelectedProcesses([...selectedProcesses, { _id: proc._id, id: proc.id || proc._id, name: proc.name }]);
                      setProcessSelect('');
                    }
                  }} style={addBtnStyle(!!processSelect)}>ADD</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                  {selectedProcesses.map((sp, idx) => (
                    <div
                      key={sp._id}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(idx, 'process')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        cursor: 'grab',
                        userSelect: 'none',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '900', color: '#94A3B8', minWidth: '18px' }}>{idx + 1}.</span>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A' }}>{sp.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button type="button" onClick={() => setSelectedProcesses(selectedProcesses.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '16px', cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}>×</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ICON */}
              <div style={{ marginBottom: '18px' }}>
                <label style={labelStyle}>ICON</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {ICONS.map((ico) => (
                    <button key={ico} type="button" onClick={() => setIcon(ico)} style={{ width: '42px', height: '42px', borderRadius: '8px', border: icon === ico ? '3px solid #0D9488' : '1px solid #E2E8F0', background: icon === ico ? '#F0FDFA' : '#F8FAFC', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s', padding: 0 }}>
                      {ico}
                    </button>
                  ))}
                </div>
              </div>

              {/* ACCENT COLOUR */}
              <div style={{ marginBottom: '22px' }}>
                <label style={labelStyle}>ACCENT COLOUR</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} style={{ width: '44px', height: '24px', padding: 0, border: '1px solid #E2E8F0', borderRadius: '4px', cursor: 'pointer', background: 'none', outline: 'none' }} />
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', fontFamily: 'monospace' }}>{accent.toUpperCase()}</span>
                  </label>
                </div>
              </div>

              {/* DEPARTMENT PATTERN */}
              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>DEPARTMENT PATTERN *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {[
                    { key: 'A', icon: '⚙️', label: 'Machine Dept', desc: 'Cycles, UPS, good/bad per cycle, machine kanbans' },
                    { key: 'B', icon: '👋', label: 'Manual / Staged', desc: 'Stages with sign-off, no machine, pcs in/out' },
                    { key: 'C', icon: '📋', label: 'Inventory / Control', desc: 'Receive, record, issue, inspect, control' }
                  ].map((p) => (
                    <div key={p.key} onClick={() => setPattern(p.key)} style={{ border: pattern === p.key ? '2.5px solid #0D9488' : '1.5px solid #E2E8F0', borderRadius: '12px', padding: '14px 8px', background: pattern === p.key ? '#F0FDFA' : '#F8FAFC', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                      <div style={{ fontSize: '22px', marginBottom: '6px' }}>{p.icon}</div>
                      <div style={{ fontSize: '12px', fontWeight: '900', color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>PATTERN {p.key}</div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#475569', margin: '2px 0 6px 0' }}>{p.label}</div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700', lineHeight: '1.3' }}>{p.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* IS ACTIVE SELECT DROPDOWN */}
              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>IS ACTIVE *</label>
                <select value={isActive ? 'true' : 'false'} onChange={(e) => setIsActive(e.target.value === 'true')} style={selectStyle}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              {/* NEXT */}
              <button disabled={!name.trim() || selectedProcesses.length === 0} onClick={handleNextStep1} style={{ width: '100%', padding: '14px', background: (name.trim() && selectedProcesses.length > 0) ? '#0D9488' : '#CBD5E1', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', cursor: (name.trim() && selectedProcesses.length > 0) ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}>
                NEXT — CONFIGURE VARIABLES →
              </button>
            </div>
          )}
          {/* ────────── STEP 2 ────────── */}
          {step === 2 && (
            <div>
              {/* PRIMARY VARIABLE */}
              <div style={{ marginBottom: '18px' }}>
                <label style={labelStyle}>PRIMARY VARIABLE (UNIT OF MEASURE) *</label>
                <select value={primaryVarId} onChange={(e) => setPrimaryVarId(e.target.value)} style={{ ...selectStyle, color: primaryVarId ? '#0F172A' : '#94A3B8' }}>
                  <option value="">— Select a rate unit —</option>
                  {activeRateUnits.map((ru) => (
                    <option key={ru._id || ru.id} value={ru._id}>{ru.name} ({ru.symbol})</option>
                  ))}
                </select>
              </div>

              {/* MACHINE / KANBANS */}
              <div style={{ marginBottom: '18px' }}>
                <label style={labelStyle}>MACHINE / KANBANS *</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input style={{ ...inputStyle, flex: 1 }} value={machineInput} onChange={(e) => setMachineInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddMachine(); } }} placeholder="e.g. Bystronic Laser, Trumpf" />
                  <button type="button" onClick={handleAddMachine} style={addBtnStyle(!!machineInput.trim())}>ADD</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                  {machines.map((m, idx) => (
                    <div
                      key={idx}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(idx, 'machine')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        cursor: 'grab',
                        userSelect: 'none',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '900', color: '#94A3B8', minWidth: '18px' }}>{idx + 1}.</span>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A' }}>{m}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button type="button" onClick={() => setMachines(machines.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '16px', cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}>×</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SUB-STAGES */}
              {pattern !== 'A' && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={labelStyle}>SUB-STAGES / PROCESS STEPS (OPTIONAL)</label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input style={{ ...inputStyle, flex: 1 }} value={stepInput} onChange={(e) => setStepInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddStep(); } }} placeholder="e.g. Nesting, Masking, Etching" />
                    <button type="button" onClick={handleAddStep} style={addBtnStyle(!!stepInput.trim())}>ADD</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                    {subStages.map((s, idx) => (
                      <div
                        key={idx}
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(idx, 'subStage')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderRadius: '6px',
                          cursor: 'grab',
                          userSelect: 'none',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '900', color: '#94A3B8', minWidth: '18px' }}>{idx + 1}.</span>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A' }}>{s}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button type="button" onClick={() => setSubStages(subStages.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '16px', cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}>×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* NAV */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: '14px', background: 'none', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '12px', fontWeight: '900', color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer' }}>← BACK</button>
                <button disabled={!primaryVarId || machines.length === 0} onClick={() => setStep(3)} style={{ flex: 2, padding: '14px', background: (primaryVarId && machines.length > 0) ? '#0D9488' : '#CBD5E1', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', cursor: (primaryVarId && machines.length > 0) ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}>NEXT — ASSIGN PEOPLE →</button>
              </div>
            </div>
          )}

          {/* ────────── STEP 3 ────────── */}
          {step === 3 && (
            <div>
              {/* SUPERVISOR */}
              <div style={{ marginBottom: '18px' }}>
                <label style={labelStyle}>SUPERVISOR IN-CHARGE *</label>
                <select value={supervisorId} onChange={(e) => setSupervisorId(e.target.value)} style={{ ...selectStyle, color: supervisorId ? '#0F172A' : '#94A3B8' }}>
                  <option value="">— Select supervisor role —</option>
                  {activeRoles.map((r) => (
                    <option key={r._id} value={r._id}>{r.name}</option>
                  ))}
                </select>
              </div>

              {/* OPERATOR */}
              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>OPERATORS LIST *</label>
                <select value={operatorId} onChange={(e) => setOperatorId(e.target.value)} style={{ ...selectStyle, color: operatorId ? '#0F172A' : '#94A3B8' }}>
                  <option value="">— Select operator role —</option>
                  {activeRoles.map((r) => (
                    <option key={r._id} value={r._id}>{r.name}</option>
                  ))}
                </select>
              </div>

              {/* NAV */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setStep(2)} style={{ flex: 1, padding: '14px', background: 'none', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '12px', fontWeight: '900', color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer' }}>← BACK</button>
                <button disabled={submitting || !isValidSupervisor || !isValidOperator} onClick={handleSubmit} style={{ flex: 2, padding: '14px', background: (submitting || !isValidSupervisor || !isValidOperator) ? '#CBD5E1' : '#0D9488', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', cursor: (submitting || !isValidSupervisor || !isValidOperator) ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}>
                  {submitting ? 'SAVING...' : (isEdit ? '✓ Update Shop Floor' : '✓ Create Shop Floor')}
                </button>
              </div>
            </div>
          )}        </div>
      </div>
    </div>
  );
}
