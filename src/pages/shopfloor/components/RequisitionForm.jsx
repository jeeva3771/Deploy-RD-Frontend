import React from 'react';
import { X, Flame, Send, Loader2 } from 'lucide-react';

const RequisitionForm = ({
    title,
    subtitle,
    categories = [],
    units = [],
    jobs = [],
    formData,
    submitting,
    handleInputChange,
    handleFormSubmit,
    onClose,
    allowManualJob = false,
    showBOMFields = false,
    selectedGroupId = '',
    selectedMaterialId = '',
    handleGroupChange,
    handleMaterialChange,
    className = "w-full",
    isReprocess = false,
    itemsToShow = [],
    selectedInventoryItemId = '',
    handleInventoryItemChange,
    selectedInventoryItem = null,
    selectedSizeName = '',
    setSelectedSizeName,
    materialCategories = [],
    selectedMaterialCategoryId = '',
    setSelectedMaterialCategoryId
}) => {
    // De-duplicate jobs based on sub_job_no/job_no
    const uniqueJobsList = [];
    const seenJobKeys = new Set();
    for (const j of jobs) {
        const jobKey = j.sub_job_no || j.job_no;
        if (jobKey && !seenJobKeys.has(jobKey)) {
            // Filter out jobs without BOM when category is BOM Material
            if (formData.category === 'BOM Material') {
                if (!j.bom_id || !j.material_groups || j.material_groups.length === 0) {
                    continue;
                }
            }
            seenJobKeys.add(jobKey);
            uniqueJobsList.push(j);
        }
    }

    // Compute BOM Material groups and items if needed
    let availableGroups = [];
    let availableMaterials = [];
    if (showBOMFields && formData.category === 'BOM Material' && formData.job_no !== 'General / No specific job') {
        const matchingJobs = jobs.filter(j => (j.sub_job_no || j.job_no) === formData.job_no);
        const seenGroupIds = new Set();
        matchingJobs.forEach(job => {
            if (job.material_groups) {
                job.material_groups.forEach(g => {
                    if (g.group_id && !seenGroupIds.has(g.group_id)) {
                        seenGroupIds.add(g.group_id);
                        availableGroups.push(g);
                    }
                });
            }
        });

        const selectedGroupObj = availableGroups.find(g => g.group_id === selectedGroupId);
        const rawMaterials = selectedGroupObj ? selectedGroupObj.materials || [] : [];

        // Filter out consumables and hardware items ONLY if NOT reprocessing
        availableMaterials = rawMaterials.filter(m => {
            if (isReprocess) return true;
            const type = (m.material_type || '').toLowerCase();
            const cat = (m.category_type || '').toLowerCase();
            const name = (m.material_name || '').toLowerCase();
            return !type.includes('consumable') && !type.includes('hardware') &&
                !cat.includes('consumable') && !cat.includes('hardware') &&
                !name.includes('consumable') && !name.includes('hardware');
        });
    }

    return (
        <form onSubmit={handleFormSubmit} className={`space-y-6 bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm ${className}`}>
            {/* Form Header */}
            <div className="border-b border-slate-100 pb-4 mb-4 flex justify-between items-center">
                <div>
                    <h3 className="text-base font-[1000] italic uppercase tracking-[0.05em]" style={{ color: '#131b2e' }}>
                        {title}
                    </h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                        {subtitle}
                    </p>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        type="button"
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all border border-slate-100"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 gap-5">
                {/* Category */}
                <div className="space-y-1.5 col-span-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">CATEGORY *</label>
                    <div className="relative">
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            disabled={isReprocess}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-black italic text-slate-700 shadow-sm appearance-none cursor-pointer focus:ring-2 focus:ring-blue-600 outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {categories.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">▼</div>
                    </div>
                </div>

                {/* Against Job */}
                <div className="space-y-1.5 col-span-1">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">AGAINST JOB (OPTIONAL)</label>
                        {allowManualJob && (
                            <button
                                type="button"
                                onClick={() => handleInputChange({
                                    target: {
                                        name: 'isManualJob',
                                        type: 'checkbox',
                                        checked: !formData.isManualJob
                                    }
                                })}
                                className="text-[8px] font-black text-blue-600 uppercase tracking-wider hover:underline"
                            >
                                {formData.isManualJob ? 'Select list' : 'Type manual'}
                            </button>
                        )}
                    </div>
                    <div className="relative">
                        {allowManualJob && formData.isManualJob ? (
                            <input
                                type="text"
                                name="manualJobNo"
                                value={formData.manualJobNo || ''}
                                onChange={handleInputChange}
                                placeholder="Enter Job Number..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-black italic text-slate-700 shadow-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all uppercase"
                            />
                        ) : (
                            <>
                                <select
                                    name="job_no"
                                    value={formData.job_no}
                                    onChange={handleInputChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-black italic text-slate-700 shadow-sm appearance-none cursor-pointer focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                                >
                                    <option value="General / No specific job">GENERAL / NO SPECIFIC JOB</option>
                                    {uniqueJobsList.map(j => (
                                        <option key={j._id} value={j.sub_job_no || j.job_no}>
                                            {j.sub_job_no || j.job_no} ({j.client_name || 'N/A'})
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">▼</div>
                            </>
                        )}
                    </div>
                </div>

                {/* BOM Fields if configured and enabled */}
                {showBOMFields && formData.category === 'BOM Material' && formData.job_no !== 'General / No specific job' && (
                    <>
                        {/* Material Group */}
                        <div className="space-y-1.5 col-span-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">MATERIAL GROUP *</label>
                            <div className="relative">
                                <select
                                    value={selectedGroupId}
                                    onChange={handleGroupChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-black italic text-slate-700 shadow-sm appearance-none cursor-pointer focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                                >
                                    <option value="">SELECT GROUP...</option>
                                    {availableGroups.map(g => (
                                        <option key={g.group_id} value={g.group_id}>
                                            {g.group_name.toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">▼</div>
                            </div>
                        </div>

                        {/* BOM Materials List (Read-Only) */}
                        {selectedGroupId && (
                            <div className="col-span-2 bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-3 shadow-inner">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                                    BOM Materials in Group (Read-Only)
                                </span>
                                <div className="space-y-2">
                                    {availableMaterials.length === 0 ? (
                                        <p className="text-xs text-slate-400 italic">No materials found in this group.</p>
                                    ) : (
                                        availableMaterials.map((m, idx) => {
                                            const matSize = m.material_input?.size || (m.material_input?.length ? `${m.material_input.length}X${m.material_input.width}` : m.size || '');
                                            const matSpec = m.material_input?.specification || m.specification || '';
                                            return (
                                                <div key={idx} className="flex items-center justify-between text-xs bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                    <span className="font-extrabold text-slate-700 uppercase">{m.material_name}</span>
                                                    <span className="font-black italic text-slate-400 text-[10px]">
                                                        {matSize && `Size: ${matSize}`} {matSpec && ` (${matSpec})`} {m.material_type && ` [${m.material_type.toUpperCase()}]`}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Item Selector (Show when category is selected and not BOM Material) */}
                {formData.category !== 'BOM Material' && formData.category !== 'Select category...' && (
                    <>
                        {/* Sub-category selection if category is Raw Material */}
                        {formData.category === 'Raw Material' && (
                            <div className="col-span-2 space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">MATERIAL CATEGORY *</label>
                                <div className="relative">
                                    <select
                                        value={selectedMaterialCategoryId}
                                        onChange={(e) => setSelectedMaterialCategoryId(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-black italic text-slate-700 shadow-sm appearance-none cursor-pointer focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                                    >
                                        <option value="">SELECT CATEGORY (e.g. ACRYLIC, MDF)...</option>
                                        {materialCategories.map(cat => (
                                            <option key={cat._id || cat.id} value={cat._id || cat.id}>
                                                {cat.name?.toUpperCase()}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">▼</div>
                                </div>
                            </div>
                        )}

                        {/* Item Selector dropdown */}
                        {(formData.category !== 'Raw Material' || selectedMaterialCategoryId) && (
                            <div className="col-span-2 space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">SELECT ITEM *</label>
                                <div className="relative">
                                    <select
                                        value={selectedInventoryItemId}
                                        onChange={(e) => handleInventoryItemChange(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-black italic text-slate-700 shadow-sm appearance-none cursor-pointer focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                                    >
                                        <option value="">SELECT ITEM...</option>
                                        {itemsToShow.map(item => (
                                            <option key={item._id || item.id} value={item._id || item.id}>
                                                {item.name} [{item.item_code}]
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">▼</div>
                                </div>
                            </div>
                        )}

                        {/* Size Selector for Sheet Materials */}
                        {selectedInventoryItem && selectedInventoryItem.item_type === 'sheet' && (
                            <div className="col-span-2 space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">SELECT SIZE *</label>
                                <div className="relative">
                                    <select
                                        value={selectedSizeName}
                                        onChange={(e) => setSelectedSizeName(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-black italic text-slate-700 shadow-sm appearance-none cursor-pointer focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                                    >
                                        <option value="">SELECT SIZE...</option>
                                        {selectedInventoryItem.stock_sizes?.map((sz, szIdx) => {
                                            const sizeLabel = sz.size || `${sz.width}x${sz.height}` || sz;
                                            return (
                                                <option key={sz._id || szIdx} value={sizeLabel}>
                                                    {sizeLabel}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">▼</div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Conditional Quantity Render */}
                {(() => {
                    const isSheetMaterial = formData.category === 'BOM Material'
                        ? availableMaterials.some(m => m.material_type?.toLowerCase() === 'sheet')
                        : (selectedInventoryItem?.item_type === 'sheet');
                    const isReprocess = title.toLowerCase().includes("reprocess");

                    if (isSheetMaterial) {
                        return (
                            <>
                                {isReprocess && (
                                    <div className="space-y-1.5 col-span-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">REPROCESS JOB QTY (PCS) *</label>
                                        <input
                                            type="number"
                                            name="reprocess_job_qty"
                                            min="0.1"
                                            step="any"
                                            value={formData.reprocess_job_qty || ''}
                                            onChange={handleInputChange}
                                            placeholder="Job Qty in Pcs"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-black italic text-slate-700 shadow-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                                        />
                                    </div>
                                )}
                                <div className="space-y-1.5 col-span-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">SHEET QTY REQD *</label>
                                    <input
                                        type="number"
                                        name="qty"
                                        min="0.1"
                                        step="any"
                                        value={formData.qty}
                                        onChange={handleInputChange}
                                        placeholder="Sheets needed"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-black italic text-slate-700 shadow-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                                    />
                                </div>
                            </>
                        );
                    } else {
                        return (
                            <div className="space-y-1.5 col-span-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">QUANTITY *</label>
                                <input
                                    type="number"
                                    name="qty"
                                    min="0.1"
                                    step="any"
                                    value={formData.qty}
                                    onChange={handleInputChange}
                                    placeholder="0"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-black italic text-slate-700 shadow-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                                />
                            </div>
                        );
                    }
                })()}

                {/* Unit */}
                <div className="space-y-1.5 col-span-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">UNIT *</label>
                    <div className="relative">
                        <select
                            name="unit"
                            value={formData.unit}
                            onChange={handleInputChange}
                            disabled={formData.category === 'BOM Material'}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-black italic text-slate-700 shadow-sm appearance-none cursor-pointer focus:ring-2 focus:ring-blue-600 outline-none transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                        >
                            {units.map(u => (
                                <option key={u} value={u}>{u.toUpperCase()}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">▼</div>
                    </div>
                </div>

                {/* Urgent Checkbox */}
                <div className="col-span-2 flex items-center gap-3 p-2 ml-1">
                    <input
                        type="checkbox"
                        name="urgent"
                        id="urgent"
                        checked={formData.urgent}
                        onChange={handleInputChange}
                        className="w-5 h-5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                    />
                    <label htmlFor="urgent" className="text-[10px] font-black text-slate-700 uppercase tracking-wider cursor-pointer select-none flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> MARK AS URGENT REQUIREMENT
                    </label>
                </div>

                {/* Remarks / Purpose */}
                <div className="col-span-2 space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">REMARKS / PURPOSE</label>
                    <textarea
                        name="remarks"
                        value={formData.remarks}
                        onChange={handleInputChange}
                        placeholder="Add details, notes, or specific reasons for the request..."
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-semibold text-slate-700 shadow-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all resize-none"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 text-white text-[11px] font-[1000] uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70"
                style={{ backgroundColor: '#131b2e' }}
            >
                {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Send className="w-4 h-4" />
                )}
                RAISE REQUISITION
            </button>
        </form>
    );
};

export default RequisitionForm;
