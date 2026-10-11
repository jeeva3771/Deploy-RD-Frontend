import { nanoid } from "@reduxjs/toolkit";
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

export default function MaterialGroup({ handleNext, handleBack, formData, setFormData, isViewMode, handleSaveDraft, isSubmitting }) {
  const [materials, setMaterials] = useState(formData.materialSpecification || []);
  const [selectedIds, setSelectedIds] = useState([]);
  const [groups, setGroups] = useState(formData.materialGroups || []);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState("");
  const [draggedGroupIndex, setDraggedGroupIndex] = useState(null);

  useEffect(() => {
    // Run if there are groups to check (even if materials list is empty, we need to clear valid groups)
    if (groups.length > 0) {
      const updatedGroups = groups.map(group => {
        // 1. Check if ALL materials in this group exist in the main list
        const allMaterialsExist = group.materials.every(groupMat =>
          materials.some(m => m.item_id === groupMat.item_id)
        );

        if (!allMaterialsExist) {
          return null; // Flag group for removal if ANY material is missing
        }

        // 2. Update them with latest specs
        const updatedMaterials = group.materials.map(groupMat => {
          const latestSpec = materials.find(m => m.item_id === groupMat.item_id);
          return latestSpec ? { ...latestSpec } : groupMat;
        });

        // 3. STRICT VALIDATION: Check if they still match (Type, Input, Total)
        // This ensures that if a material's spec changed in a way that breaks group uniformity, the group is dissolved.
        if (updatedMaterials.length > 0) {
          const skipTypes = ["Consumable", "Hardware"];
          const checkItems = updatedMaterials.filter(
            (m) => !skipTypes.includes(m.category_type)
          );

          if (checkItems.length > 1) {
            const first = checkItems[0];

            const allSame = checkItems.every(
              (m) =>
                m.material_type === first.material_type &&
                JSON.stringify(m.input) === JSON.stringify(first.input) &&
                JSON.stringify(m.wastage) === JSON.stringify(first.wastage) &&
                m.final_total === first.final_total
            );

            if (!allSame) {
              return null;
            }
          }
          // const first = updatedMaterials[0];
          // const allSame = updatedMaterials.every(
          //   (m) =>
          //     m.material_type === first.material_type &&
          //     JSON.stringify(m.input) === JSON.stringify(first.input) &&
          //     m.final_total === first.final_total
          // );

          // if (!allSame) {
          //   return null; // Group is no longer valid
          // }
        }

        return {
          ...group,
          materials: updatedMaterials
        };
      }).filter(group => group !== null); // Remove the flagged groups

      // Only update if there is an actual change to avoid infinite loops
      if (JSON.stringify(updatedGroups) !== JSON.stringify(groups)) {
        setGroups(updatedGroups);
        setFormData(prev => ({ ...prev, materialGroups: updatedGroups }));
      }
    }
  }, [materials, groups, setFormData]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const createGroup = () => {
    if (!groupNameInput.trim()) {
      setError("Group name is required");
      return;
    }
    if (selectedIds.length === 0) {
      setError("Select at least one material");
      return;
    }

    const selectedMaterials = materials.filter((m) =>
      selectedIds.includes(m.item_id)
    );

    const skipTypes = ["Consumable", "Hardware"];

    const checkItems = selectedMaterials.filter(
      (m) => !skipTypes.includes(m.category_type)
    );

    let allSame = true;
    if (checkItems.length > 1) {
      const first = checkItems[0];

      allSame = checkItems.every((m) =>
        m.material_type === first.material_type &&
        JSON.stringify(m.input) === JSON.stringify(first.input) &&
        JSON.stringify(m.wastage) === JSON.stringify(first.wastage) &&
        m.final_total === first.final_total
      );
    }
    // // Check if all selected materials have the same material_type, input, and final_total
    // const first = selectedMaterials[0];
    // const allSame = selectedMaterials.every(
    //   (m) =>
    //     m.material_type === first.material_type &&
    //     JSON.stringify(m.input) === JSON.stringify(first.input) &&
    //     m.final_total === first.final_total
    // );

    if (!allSame) {
      setError("All selected materials must have the same type, size, and total");
      return;
    }

    const newGroup = {
      group_id: nanoid(16),
      group_name: groupNameInput,
      materials: selectedMaterials,
    };

    const updatedGroups = [...groups, newGroup];
    setGroups(updatedGroups);
    setSelectedIds([]);
    setGroupNameInput("");
    setError("");
    setIsModalOpen(false);

    setFormData({
      ...formData,
      materialGroups: updatedGroups,
    });
  };


  const openModal = () => {
    if (selectedIds.length === 0) {
      return;
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setGroupNameInput("");
    setError("");
  };

  const onNextClick = () => {
    console.log("groups", groups)
    setFormData({
      ...formData,
      materialGroups: groups,
    });
    handleNext({ materialGroups: groups });
  };

  const handleRefresh = () => {
    setGroups([])
    setFormData({
      ...formData,
      materialGroups: [],
      materialprocess: [],
    })
  }

  const removeGroup = (index) => {
    const updated = groups.filter((_, i) => i !== index);
    setGroups(updated);
    setFormData({
      ...formData,
      materialGroups: updated,
    });
  };

  const handleDragStart = (e, index) => {
    setDraggedGroupIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedGroupIndex === null || draggedGroupIndex === index) return;

    const newGroups = [...groups];
    const draggedGroup = newGroups[draggedGroupIndex];

    newGroups.splice(draggedGroupIndex, 1);
    newGroups.splice(index, 0, draggedGroup);

    setGroups(newGroups);
    setDraggedGroupIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedGroupIndex(null);
  };

  // Helper to check if a material (by item_id) is inside ANY group
  const isMaterialInAnyGroup = (item_id) => {
    return groups.some(group =>
      group.materials.some(gm => gm.item_id === item_id)
    );
  };

  return (
    <div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold mb-4"> Ungrouped </h2>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isViewMode}

          className="flex items-center gap-1 text-red-600 hover:text-red-800 transition-colors text-sm font-semibold"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh All
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <div className="space-y-2 max-h-[60vh] overflow-y-auto mb-2">
            {materials.map((mat, idx) => {
              const isGrouped = isMaterialInAnyGroup(mat.item_id);
              return (
                <div
                  key={idx}
                  className={`border rounded p-3 flex items-start gap-3 cursor-pointer ${selectedIds.includes(mat.item_id) ? "bg-violet-50 border-violet-500" : ""
                    }`}
                  onClick={() => toggleSelect(mat.item_id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(mat.item_id)}
                    readOnly
                    disabled={isViewMode}
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div className="font-medium">
                        {mat.material_name}{" "}
                        {mat.alias && <span className="text-blue-600">"{mat.alias}"</span>}
                      </div>
                      {/* UNGROUPED LABEL */}
                      {!isGrouped ? (
                        <span className="px-2 py-0.5 text-[10px] sm:text-xs font-semibold bg-gray-100 text-gray-500 rounded border border-gray-200 whitespace-nowrap ml-2">
                          Ungrouped
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] sm:text-xs font-semibold bg-green-50 text-green-600 rounded border border-green-200 whitespace-nowrap ml-2">
                          Grouped
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600">
                      {mat.input?.size && <span className="mx-1">Size: {mat.input.size}</span>}
                      {mat.color && <span className="mx-1">• {mat.color}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <button onClick={openModal} disabled={isViewMode} className="mt-2 px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700" >
            Create Group
          </button>
        </div>

        <div className="flex-1">
          {groups.length > 0 && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                {groups.map((g, i) => (
                  <div
                    key={i}
                    draggable
                    onDragStart={(e) => handleDragStart(e, i)}
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDragEnd={handleDragEnd}
                    className={`relative border rounded-lg p-2 bg-gray-50 cursor-move transition-all ${draggedGroupIndex === i ? "opacity-50 border-blue-400 bg-blue-50" : ""
                      }`}
                  >
                    {/* <div className="flex items-center gap-2">
                      <i className="fa-solid fa-grip-lines text-gray-400"></i>
                      <div>
                        <div className="font-semibold text-gray-800 text-sm">{g.group_name}</div>
                        <div className="text-xs text-gray-600 mt-0.5">{g.materials.length} Components</div>
                      </div>
                    </div> */}

                    <button
                      onClick={() => removeGroup(i)}
                      disabled={isViewMode}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm cursor-pointer"
                      title="Remove group"
                    >
                      ✕
                    </button>
                    <div className="font-semibold text-gray-800 text-sm">{g.group_name}</div>
                    <div className="text-xs text-gray-600 mt-0.5">{g.materials.length} Components</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      <div className="flex justify-between mt-6">
        <button onClick={handleBack} className="px-4 py-2 rounded-md bg-orange-500 text-white border border-orange-600 hover:bg-orange-600">
          Back
        </button>

        {!isViewMode && (
          <button
            onClick={() => handleSaveDraft({ materialGroups: groups })}
            className="px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save as Draft"}
          </button>
        )}

        <button onClick={onNextClick}
          disabled={groups.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded">
          Next
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-sm rounded-lg p-5 shadow-lg">

            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              Enter Group Name
            </h3>

            <input
              type="text"
              value={groupNameInput}
              onChange={(e) => setGroupNameInput(e.target.value)}
              placeholder="Enter group name"
              className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-violet-400"
            />

            {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={closeModal}
                className="px-4 py-1.5 text-sm border rounded-md text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={createGroup}
                className="px-4 py-1.5 text-sm bg-violet-600 text-white rounded-md hover:bg-violet-700"
              >
                Create
              </button>
            </div>


          </div>
        </div>
      )}

    </div>
  );
}
