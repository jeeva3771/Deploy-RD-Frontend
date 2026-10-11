import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getAllProcesses } from "../../../reducer/processReducer";
import { FormControl, TextField, Autocomplete, Select, MenuItem, FormControlLabel, Switch } from "@mui/material";
import { toast } from "react-toastify";

export default function MaterialGroupWithProcesses({ handleNext, handleBack, formData, setFormData, isViewMode, handleSaveDraft, isSubmitting }) {
  const dispatch = useDispatch();
  const { processes } = useSelector((state) => state.process);
  const { bomid } = useParams();

  const [selectedProcesses, setSelectedProcesses] = useState([]);
  const [selectedProcessDropdown, setSelectedProcessDropdown] = useState({});
  const [isProcessCleared, setIsProcessCleared] = useState(false)
  const [materialprocess, setMaterialprocess] = useState(formData.materialprocess || [])

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [splitModalData, setSplitModalData] = useState(null);
  const [modalPrompt, setModalPrompt] = useState("");
  const [modalValue, setModalValue] = useState("");
  const [modalGroupIndex, setModalGroupIndex] = useState(null);
  const [modalProcessIndex, setModalProcessIndex] = useState(null);

  useEffect(() => {
    dispatch(getAllProcesses({ params: { order: "asc" } }));
  }, [dispatch]);

  const getMaterials = useCallback((groupIndex) => {
    const materials =
      formData.materialGroups?.[groupIndex]?.materials || [];

    const sheetMaterials = materials

    if (sheetMaterials.length === 0) return null;

    return sheetMaterials;
  }, [formData.materialGroups]);

  // 1. INITIALIZATION & REINDEXING EFFECT
  useEffect(() => {
    const originalQty = Number(formData.originalJobQty);
    const currentQty = Number(formData.jobQty);
    const isQtyChanged = originalQty !== 0 && originalQty !== currentQty;

    // Only run if local state is empty OR the number of groups has changed (reordering) OR quantity has changed
    const isLocalStateEmpty = materialprocess.length === 0 && formData.materialprocess?.length > 0;
    const hasStructureChanged = formData.materialGroups.length !== selectedProcesses.length;

    if ((isLocalStateEmpty || hasStructureChanged || isQtyChanged) && formData.materialGroups.length > 0) {
      const newSelectedProcesses = [];

      const updatedMaterialProcess = formData.materialGroups.map((group, groupIdx) => {
        const foundGroup = (formData.materialprocess || []).find(
          (process) => process.material_group_id === group.group_id
        );

        if (!foundGroup || !foundGroup.processes) {
          newSelectedProcesses.push([]);
          return { ...group, processes: [] };
        }

        // Apply indexing based on current array position (groupIdx)
        const processUpdate = foundGroup.processes.map((p) => {
          const subIndex = p.process_index.includes('.')
            ? p.process_index.split('.').slice(1).join('.')
            : p.process_index;

          let proc = {
            ...p,
            processId: p.process_id,
            processIndex: `${groupIdx + 1}.${subIndex}`, // Force new group index prefix
            processName: p.process_name,
            rowType: p.row_type,
            outsourceType: p.outsource_type,
            outsourceRate: p.outsource_rate,
            currentTotalMaterial: p.current_total_material,
            jobMetric: p.job_metric,
            orderQty: p.order_qty,
            unitCost: p.unit_cost,
            jobCost: p.job_cost, // Match naming convention
            prompt: p.prompt || "",
            department: p.department,
          };

          if (isQtyChanged) {
            const getMaterial = getMaterials(groupIdx) || [{}];
            const firstMat = getMaterial[0] || {};
            const groupFinalTotal = firstMat.final_total || 0;

            const processNameLower = (proc.processName || "").toLowerCase();
            const promptLower = (proc.prompt || "").toLowerCase();

            let processType = proc.processType || proc.type || "";
            if (!processType) {
              if (processNameLower.includes("laser") || processNameLower.includes("cutting") || promptLower.includes("sheet")) {
                processType = "sheet_time_based";
              } else if (processNameLower.includes("punching") || processNameLower.includes("stroke") || processNameLower.includes("ups")) {
                processType = "ups_based";
              } else if (promptLower.includes("sq inches") || promptLower.includes("area")) {
                processType = "job_absolute_area";
              } else {
                processType = "standard_unit";
              }
            }

            let currentTotalMaterial = currentQty;
            if (["sheet_time_based", "sheet_rate_based"].includes(processType)) {
              currentTotalMaterial = groupFinalTotal;
            } else {
              currentTotalMaterial = groupFinalTotal;
            }

            const actualInput = proc.input && typeof proc.input === "object"
              ? Number(proc.input.actual_input || 0)
              : Number(proc.input || 0);

            const isUVProcess = processNameLower.includes("uv") || processNameLower.includes("print");
            const hasLaserBefore = foundGroup.processes.some(p => (p.processName || p.process_name || "").toLowerCase().includes("laser"));

            let jobMetric = 0;

            if (isUVProcess) {
              if (currentQty === 1) {
                jobMetric = 1;
              } else {
                const sheetUps = Number(firstMat?.input?.ups || 1);
                jobMetric = hasLaserBefore
                  ? actualInput * (currentTotalMaterial * sheetUps)
                  : actualInput * currentTotalMaterial;
              }
            } else {
              switch (processType) {
                case "sheet_time_based":
                case "sheet_rate_based":
                  jobMetric = currentTotalMaterial * actualInput;
                  break;

                case "standard_unit": {
                  const matWastageVal = Number(firstMat.wastage?.value || 0);
                  const matWastageType = firstMat.wastage?.type || "%";
                  let qtyWithWastage = currentQty;
                  if (matWastageType === "%") {
                    qtyWithWastage = Math.ceil(currentQty * (1 + matWastageVal / 100));
                  } else {
                    qtyWithWastage = Math.ceil(currentQty + matWastageVal);
                  }
                  jobMetric = qtyWithWastage * actualInput;
                  break;
                }

                case "job_absolute_area": {
                  const oldQtyNum = Number(formData.originalJobQty || 1);
                  jobMetric = oldQtyNum > 0 ? (actualInput / oldQtyNum) * currentQty : actualInput;
                  break;
                }

                case "ups_based":
                  jobMetric = actualInput > 0 ? Math.ceil(currentQty / actualInput) : 0;
                  break;

                default:
                  jobMetric = actualInput;
                  break;
              }
            }

            const rateVal = Number(proc.rate || 0);
            const outsourceRateVal = Number(proc.outsourceRate || 0);

            const jobCost = proc.rowType === "Outsource"
              ? (jobMetric * outsourceRateVal)
              : (jobMetric * rateVal);

            const unitCost = currentQty > 0 ? jobCost / currentQty : 0;

            proc.currentTotalMaterial = currentTotalMaterial;
            proc.jobMetric = jobMetric;
            proc.orderQty = currentQty;
            proc.jobCost = Number(jobCost.toFixed(2));
            proc.unitCost = Number(unitCost.toFixed(2));
          }

          return proc;
        });

        newSelectedProcesses.push(processUpdate);
        return {
          ...foundGroup,
          material_total: (getMaterials(groupIdx) || [{}])[0]?.final_total || 0,
          processes: processUpdate
        };
      });

      setSelectedProcesses(newSelectedProcesses);
      setMaterialprocess(updatedMaterialProcess);

      if (isQtyChanged) {
        setFormData((prev) => ({
          ...prev,
          originalJobQty: currentQty,
          materialprocess: updatedMaterialProcess,
        }));
        toast.info("Job Quantity updated. Material processes recalculated.");
      }
    }
    // DEPENDENCY: Only watch parent data.
  }, [formData.materialGroups, formData.materialprocess, materialprocess, selectedProcesses, formData.jobQty, formData.originalJobQty, setFormData, getMaterials]);


  // 2. SELECTIVE CHANGE DETECTION EFFECT
  useEffect(() => {
    if (bomid && materialprocess.length > 0) {
      // Selective reset for Spec changes
      let indicesToClear = [];
      formData.materialGroups.forEach((group, idx) => {
        const savedGroup = materialprocess.find(m => m.material_group_id === group.group_id);
        if (savedGroup) {
          const currentInput = group.materials?.[0]?.input || {};
          const currentTotal = Number(group.materials?.[0]?.final_total || 0);

          const hasChanged = JSON.stringify(savedGroup.material_input) !== JSON.stringify(currentInput);

          if (hasChanged) indicesToClear.push({ idx, groupId: group.group_id });
        }
      });

      if (indicesToClear.length > 0) {
        setSelectedProcesses(prev => {
          const newState = [...prev];
          indicesToClear.forEach(({ idx }) => { newState[idx] = []; });
          return newState;
        });

        setFormData(prev => ({
          ...prev,
          materialprocess: prev.materialprocess.map(item => {
            const shouldClear = indicesToClear.some(change => change.groupId === item.material_group_id);
            return shouldClear ? { ...item, processes: [] } : item;
          })
        }));
      }
    }
  }, [formData.materialGroups, bomid, materialprocess, setFormData]);


  const calculateJobMetric = ({
    processType,
    input,
    orderQty,
    currentTotalMaterial,
    groupIndex
  }) => {
    switch (processType) {
      case "sheet_time_based":
        return currentTotalMaterial * input;

      case "sheet_rate_based":
        return currentTotalMaterial * input;

      case "standard_unit": {
        const getMaterial = getMaterials(groupIndex);
        console.log("getMaterial", getMaterial);
        console.log("job_qty", formData.jobQty);
        const material_wastage = getMaterial[0].wastage;
        let qty_with_wastage = formData.jobQty;
        if (material_wastage.type === "%") {
          qty_with_wastage = Math.ceil(formData.jobQty * (1 + material_wastage.value / 100));
        } else {
          qty_with_wastage = Math.ceil(formData.jobQty + material_wastage.value);
        }
        return qty_with_wastage * input;
      }

      case "job_absolute_area":
        return input;

      case "ups_based":
        return input > 0 ? Math.ceil(orderQty / input) : 0;

      default:
        return 1;
    }
  };

  const createProcessRow = (row) => {
    const jobCost =
      row.rowType === "Outsource"
        ? row.jobMetric * Number(row.outsourceRate || 0)
        : row.jobMetric * Number(row.rate || 0);

    return {
      ...row,
      jobCost: Number(jobCost.toFixed(2)),
      unitCost: row.orderQty
        ? Number((jobCost / row.orderQty).toFixed(2))
        : 0,
    };
  };

  const recalculateCost = (row) => {
    const jobCost =
      row.rowType === "Outsource"
        ? row.jobMetric * Number(row.outsourceRate || 0)
        : row.jobMetric * Number(row.rate || 0);

    return {
      ...row,
      jobCost: Number(jobCost.toFixed(2)),
      unitCost: row.orderQty
        ? Number((jobCost / row.orderQty).toFixed(2))
        : 0,
    };
  };




  const reindexProcesses = (processes, groupIndex) => {
    let baseNo = 1;
    let currentBase = null;

    return processes.map((p) => {
      let index;

      const hasSuffix =
        p.processIndex?.endsWith("a") || p.processIndex?.endsWith("b");

      if (hasSuffix) {
        // first split row (a)
        if (!currentBase) {
          currentBase = `${groupIndex + 1}.${baseNo}`;
        }

        index = p.processIndex.endsWith("a")
          ? `${currentBase}a`
          : `${currentBase}b`;

        // after b → move to next base
        if (p.processIndex.endsWith("b")) {
          baseNo++;
          currentBase = null;
        }
      } else {
        index = `${groupIndex + 1}.${baseNo}`;
        baseNo++;
        currentBase = null;
      }

      return {
        ...p,
        processIndex: index,
      };
    });
  };

  const getUVBedByProcessId = (processId, jobMetric, processes) => {
    const proc = processes.find(p => p._id === processId || p.id === processId);
    if (!proc || !proc.is_uv || !proc.beds?.length) return null;

    const sorted = [...proc.beds].sort((a, b) => a.bed_area - b.bed_area);

    const matched = sorted.find(b => jobMetric < b.bed_area);

    return matched || sorted[sorted.length - 1];
  };

  const handleProcessDetailsChange = (
    groupIndex,
    processIndex,
    field,
    value,
    mode = "edit"
  ) => {
    setSelectedProcesses((prev) => {
      const updated = structuredClone(prev);
      const process = updated[groupIndex][processIndex];
      const isUV = process.processName.toLowerCase().includes("uv");

      /* -------------------- FIELD UPDATE -------------------- */

      if (field === "outsourcetoggle") {
        if (value.checked) {
          process.rowType = "Outsource";
          process.outsource = process.currentTotalMaterial;
          process.outsourceType = "qty";
        } else {
          process.rowType = "Inhouse";
          process.outsource = 0;
          process.outsourceType = "%";
        }
      } else if (field === "outsourcesplit") {
        process.outsource = value.outsource;
        process.outsourceType = value.outsourceType;
        process.inhouse = value.inhouse;
      } else {
        process[field] = value;
      }

      /* -------------------- INPUT → INHOUSE DEFAULT -------------------- */

      if (field === "input" && mode === "calculate") {
        const processMeta = processes.find(
          (p) => p._id === process.processId
        );
        let rowType = "Inhouse";

        if (isUV) {
          if (Number(formData.jobQty) === 1) {
            rowType = process.rowType ? process.rowType : rowType;
            process.rate = processMeta.mov
            process.jobMetric = 1
            process.input.actual_input = 0;
          } else {
            const length_gap = Number(process.input.length_gap || 0);
            const width_gap = Number(process.input.width_gap || 0);
            const l = Number(process.input.baselength || 0);
            const w = Number(process.input.basewidth || 0);

            const L = l + length_gap + length_gap;
            const W = w + width_gap + width_gap;
            const sqin = L * W;

            process.input.length = L;
            process.input.width = W;
            process.input.actual_input = sqin;

            const hasLaserBefore = updated[groupIndex]?.some(p =>
              p.processName.toLowerCase().includes("laser")
            );

            const materials = getMaterials(groupIndex);
            const sheet = materials.find((m) => m.material_type === "sheet");
            const jobUps = sheet ? Number(sheet.input.ups) : 1;

            const isUVinput = hasLaserBefore ? Number(process.input.actual_input) * (process.currentTotalMaterial * jobUps) : Number(process.input.actual_input) * process.currentTotalMaterial

            // IMPORTANT: sqin becomes the input for job metric
            process.jobMetric = calculateJobMetric({
              processType: processMeta.type,
              input: Number(isUVinput),
              orderQty: process.orderQty,
              currentTotalMaterial: process.currentTotalMaterial,
              groupIndex: groupIndex
            });

            const selectedBed = getUVBedByProcessId(
              process.processId,
              process.jobMetric,
              processes
            );

            if (selectedBed) {
              process.rate = selectedBed.rate;
            }


            rowType = process.rowType ? process.rowType : rowType;
          }

        } else {
          process.jobMetric = calculateJobMetric({
            processType: processMeta.type,
            input: Number(process.input.actual_input),
            orderQty: process.orderQty,
            currentTotalMaterial: process.currentTotalMaterial,
            groupIndex: groupIndex
          });
        }

        process.rowType = rowType; // default
        updated[groupIndex][processIndex] = recalculateCost(process);
        return updated;
      }

      /* -------------------- FULLY OUTSOURCE TOGGLE -------------------- */

      if (field === "outsourcetoggle" && mode === "calculate") {
        updated[groupIndex][processIndex] = recalculateCost(process);
        return updated;
      }

      /* -------------------- OUTSOURCE RATE CHANGE -------------------- */

      if (field === "outsourceRate" && mode === "calculate") {
        updated[groupIndex][processIndex] = recalculateCost(process);
        return updated;
      }

      /* -------------------- SPLIT (STRUCTURAL CHANGE) -------------------- */

      if (field === "outsourcesplit") {
        const processMeta = processes.find(
          (p) => p._id === process.processId
        );

        const materials = getMaterials(groupIndex);
        const sheet = materials.find((m) => m.material_type === "sheet");
        const jobUps = sheet ? Number(sheet.input.ups) : 1;

        const inhouseQty =
          process.outsourceType === "%"
            ? Math.ceil(
              process.currentTotalMaterial *
              (process.inhouse / 100)
            )
            : Number(process.inhouse);

        const outsourceQty =
          process.outsourceType === "%"
            ? process.currentTotalMaterial - inhouseQty
            : Number(process.outsource);

        const inhouseMetric = calculateJobMetric({
          processType: processMeta.type,
          input: process.input.actual_input,
          orderQty: inhouseQty * jobUps,
          currentTotalMaterial: inhouseQty,
          groupIndex: groupIndex
        });

        const outsourceMetric = calculateJobMetric({
          processType: processMeta.type,
          input: process.input.actual_input,
          orderQty: outsourceQty * jobUps,
          currentTotalMaterial: outsourceQty,
          groupIndex: groupIndex
        });

        const baseIndex = process.processIndex;

        const rows = [
          createProcessRow({
            ...process,
            processIndex: `${baseIndex}a`,
            input: isUV ? { ...(sheet ? process.input : { baselength: "", basewidth: "", length: "", width: "" }), length_gap: "", width_gap: "", actual_input: "" } : process.input,
            rowType: "Outsource",
            currentTotalMaterial: outsourceQty,
            jobMetric: outsourceMetric,
            orderQty: outsourceQty * jobUps,
          }),
          createProcessRow({
            ...process,
            processIndex: `${baseIndex}b`,
            input: isUV ? { ...(sheet ? process.input : { baselength: "", basewidth: "", length: "", width: "" }), length_gap: "", width_gap: "", actual_input: "" } : process.input,
            rowType: "Inhouse",
            currentTotalMaterial: inhouseQty,
            jobMetric: inhouseMetric,
            orderQty: inhouseQty * jobUps,
            outsource: 0,
            outsourceRate: 0,
            vendor: "",
          }),
        ];

        updated[groupIndex].splice(processIndex, 1, ...rows);
        updated[groupIndex] = reindexProcesses(updated[groupIndex], groupIndex);
        return updated;
      }


      updated[groupIndex] = reindexProcesses(updated[groupIndex], groupIndex);

      return updated;
    });
  };

  const SplitModal = ({ process, groupIndex, processIndex }) => {

    const [outsource, setOutsource] = useState(process.outsource || 0);
    const [outsourceType, setOutsourceType] = useState(process.outsourceType || "%");

    const inhouse =
      outsourceType === "%"
        ? 100 - Number(outsource || 0)
        : process.currentTotalMaterial - Number(outsource || 0);

    const handleSplitSubmit = (splitModalData) => {
      if (!splitModalData) return;

      const { process, groupIndex, processIndex } = splitModalData;

      // Validate
      if (!process.outsourceType) {
        alert("Please select outsource type");
        return;
      }

      const outsourceVal = Number(outsource || 0);
      if (outsourceVal > 0 && inhouse !== 0) {
        handleProcessDetailsChange(
          groupIndex,
          processIndex,
          "outsourcesplit",
          {
            outsource: outsource,
            outsourceType: outsourceType,
            inhouse: inhouse
          },
          "split"
        );
      }

      setSplitModalData(null);
    };

    return (
      <div className="bg-white p-6 rounded-lg w-96">
        <h3 className="text-lg font-semibold mb-4">Split Process</h3>
        <div className="flex gap-2 items-center">
          <div>
            <label className="text-sm">Outsource</label>
            <input
              type="number"
              value={outsource}
              onChange={(e) => setOutsource(e.target.value)}
              className="w-24 p-2 rounded border"
              disabled={isViewMode}

            />
          </div>

          <div>
            <label className="text-sm">Inhouse</label>
            <input
              type="number"
              value={inhouse}
              disabled
              className="w-24 p-2 rounded border bg-gray-100"

            />
          </div>

          <FormControl size="small" className="w-24">
            <label className="text-sm">Type</label>
            <Select
              value={outsourceType}
              onChange={(e) => setOutsourceType(e.target.value)}
              disabled={isViewMode}

            >
              <MenuItem value="%">%</MenuItem>
              <MenuItem value="qty">Qty</MenuItem>
            </Select>
          </FormControl>
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={() => handleSplitSubmit({ process, groupIndex, processIndex })} className="px-4 py-2 bg-blue-600 text-white rounded">
            OK
          </button>
          <button onClick={() => setSplitModalData(null)} className="ml-2 px-4 py-2 border rounded text-gray-600">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // Define the clear function inside MaterialGroupWithProcesses
  const handleClearAll = () => {
    // Reset local state to empty arrays for each group
    const resetProcesses = formData.materialGroups.map(() => []);
    setSelectedProcesses(resetProcesses);

    // Clear the parent form data
    setFormData((prev) => ({
      ...prev,
      materialprocess: []
    }));

    toast.info("All processes have been cleared.");
  };

  const isSplitRow = (processIndex = "") =>
    processIndex.endsWith("a") || processIndex.endsWith("b");

  const getBaseIndex = (processIndex = "") =>
    processIndex.replace(/[ab]$/, "");

  const isProcessAlreadySplit = (groupProcesses, baseIndex) =>
    groupProcesses.some(
      (p) =>
        p.processIndex.startsWith(baseIndex) &&
        isSplitRow(p.processIndex)
    );

  const getNextProcessIndex = (groupProcesses = [], groupIndex) => {
    const baseIndexes = new Set();

    groupProcesses.forEach((p) => {
      if (!p.processIndex) return;
      baseIndexes.add(getBaseIndex(p.processIndex));
    });

    return `${groupIndex + 1}.${baseIndexes.size + 1}`;
  }

  const addProcessToGroup = (groupIndex, processId) => {
    const process = processes.find((p) => p.id === processId);
    if (!process) return;

    const isUV = process.name.toLowerCase().includes("uv");

    const updatedProcesses = [...selectedProcesses];
    updatedProcesses[groupIndex] = updatedProcesses[groupIndex] || [];


    const get_material_data = getMaterials(groupIndex);

    let currentTotalMaterial = formData.jobQty

    if (["sheet_time_based", "sheet_rate_based"].includes(process.processType)) {
      currentTotalMaterial = get_material_data.filter(
        (m) => m.material_type === "sheet"
      )[0].final_total;
    } else {
      currentTotalMaterial = get_material_data[0].final_total
    }

    const baseIndex = getNextProcessIndex(
      updatedProcesses[groupIndex],
      groupIndex
    );

    console.log("process", process);

    let processRate = ((Number(formData.jobQty) >= 1) && (Number(formData.jobQty) <= 5)) ?
      process.min_rate_slab_2 : ((Number(formData.jobQty) > 5) && (Number(formData.jobQty) <= 25)) ? process.min_rate_slab_1 : process.rate;

    console.log("processRate", processRate);

    let length = "";
    let width = "";
    let length_gap = "";
    let width_gap = "";

    let processInput = { actual_input: 0 }

    let jobMetric = calculateJobMetric({
      processType: process.type,
      input: Number(processInput.actual_input),
      orderQty: formData.jobQty,
      currentTotalMaterial: currentTotalMaterial,
      groupIndex: groupIndex
    });

    if (isUV) {
      if (Number(formData.jobQty) === 1) {
        processRate = process.mov;
        jobMetric = 1;
        processInput = { baselength: "", basewidth: "", length: "", width: "", length_gap: "", width_gap: "", actual_input: 0 };
      } else {
        const sheet = get_material_data.find(m => m.material_type === "sheet");

        const hasLaserBefore = updatedProcesses[groupIndex]?.some(p =>
          p.processName.toLowerCase().includes("laser")
        );

        if (sheet) {
          // CASE 1: UV before laser → take from sheet size
          if (!hasLaserBefore && sheet.input?.size) {
            const [l, w] = sheet.input.size.split("x");
            length = l;
            width = w;
          }

          // CASE 2: UV after laser → take one_up values
          if (hasLaserBefore) {
            length = sheet.input.one_up_length;
            width = sheet.input.one_up_width;
          }
        }
        processInput = { baselength: length, basewidth: width, length, width, length_gap, width_gap, actual_input: `${Number(length || 0) * Number(width || 0)}` }

        const isUVinput = hasLaserBefore ? Number(processInput.actual_input) * (currentTotalMaterial * (sheet.input?.ups || 1)) : Number(processInput.actual_input) * currentTotalMaterial
        jobMetric = calculateJobMetric({
          processType: process.type,
          input: Number(isUVinput),
          orderQty: formData.jobQty,
          currentTotalMaterial: currentTotalMaterial,
          groupIndex: groupIndex
        });

        const selectedBed = getUVBedByProcessId(
          process._id,
          jobMetric,
          processes
        );
        processRate = selectedBed.rate;
      }
    }

    // Add process with default input 0
    updatedProcesses[groupIndex].push(createProcessRow({
      processId: process._id,
      processIndex: baseIndex,
      processName: process.name,
      rate: processRate,
      department: process.department,
      unit: process.unit.symbol,
      currentTotalMaterial: currentTotalMaterial,
      input: processInput,
      outsource: 0,
      rowType: "Inhouse",
      inhouse: 0,
      vendor: "",
      outsourceType: "%",
      unitCost: process.rate,
      jobCost: 0,
      jobMetric: jobMetric,
      orderQty: formData.jobQty,
      prompt: process.prompt || "",
    }));
    setSelectedProcesses(updatedProcesses);

    // Open modal for input
    setModalPrompt(process.prompt);
    setModalGroupIndex(groupIndex);
    setModalProcessIndex(updatedProcesses[groupIndex].length - 1);
    setModalValue(""); // reset modal input
    if (!isUV) {
      setIsModalOpen(true);
    }
  };

  const handleModalSubmit = () => {
    if (modalGroupIndex !== null && modalProcessIndex !== null) {
      handleProcessDetailsChange(modalGroupIndex, modalProcessIndex, "input", { actual_input: Number(modalValue) }, "calculate");
    }
    setIsModalOpen(false);
  };

  const removeProcessFromGroup = (groupIndex, processIndex) => {
    const updatedProcesses = [...selectedProcesses];
    updatedProcesses[groupIndex].splice(processIndex, 1);
    updatedProcesses[groupIndex] = reindexProcesses(updatedProcesses[groupIndex], groupIndex);
    setSelectedProcesses(updatedProcesses);
  };

  const onNextClick = () => {

    for (let groupIndex = 0; groupIndex < selectedProcesses.length; groupIndex++) {
      const group = selectedProcesses[groupIndex];

      for (let processIndex = 0; processIndex < group.length; processIndex++) {
        const process = group[processIndex];

        if (process.rowType === "Outsource") {
          if (!process.outsourceRate || process.outsourceRate === 0) {
            toast.error(
              `Please enter an Outsource Rate for process "${process.processName}" in Group ${groupIndex + 1}`
            );
            return;
          }

          if (!process.vendor || process.vendor.trim() === "") {
            toast.error(
              `Please enter a Vendor for process "${process.processName}" in Group ${groupIndex + 1}`
            );
            return;
          }
        }
      }
    }

    const materialprocess = formData.materialGroups.map((group, groupIndex) => {
      const materials = getMaterials(groupIndex);
      const firstMaterial = materials[0] || {};

      //   return {
      //     material_group_id: group.id || groupIndex + 1,
      //     material_group_name: group.group_name,
      //     material_total: firstMaterial.final_total || 0,
      //     material_unit: firstMaterial.material_type === "sheet" ? "Sheet" : "Pcs",
      //     processes: (selectedProcesses[groupIndex] || []).map((p) => ({
      //       process_id: p.processId,
      //       process_index: p.processIndex,
      //       process_name: p.processName,
      //       input: Number(p.input),
      //       row_type: p.rowType,
      //       outsource: Number(p.outsource || 0),
      //       outsource_type: p.outsourceType || "",
      //       outsource_rate: p.outsourceRate,
      //       vendor: p.vendor || "",
      //       rate: Number(p.rate),
      //       inhouse: p.inhouse,
      //       current_total_material: p.currentTotalMaterial,
      //       job_metric: p.jobMetric,
      //       order_qty: p.orderQty,
      //       unit_cost: Number(p.unitCost),
      //       job_cost: Number(p.jobCost),
      //     })),
      //   };
      // });

      return {
        material_group_id: group.group_id || groupIndex + 1,
        material_group_name: group.group_name,
        material_total: firstMaterial.final_total || 0,
        material_unit: firstMaterial.material_type === "sheet" ? "Sheet" : "Pcs",
        material_input: group.materials[0].input,
        processes: (selectedProcesses[groupIndex] || []).map((p) => ({
          process_id: p.processId,
          process_index: p.processIndex,
          process_name: p.processName,
          department: p.department,
          prompt: p.prompt || "",
          // input: Number(p.input),
          input: p.input,
          row_type: p.rowType,
          outsource: Number(p.outsource || 0),
          outsource_type: p.outsourceType || "",
          outsource_rate: p.outsourceRate,
          vendor: p.vendor || "",
          rate: Number(p.rate),
          inhouse: p.inhouse,
          current_total_material: p.currentTotalMaterial,
          job_metric: p.jobMetric,
          order_qty: p.orderQty,
          unit_cost: Number(p.unitCost),
          job_cost: Number(p.jobCost),
        })),
      };
    });

    setFormData({
      ...formData,
      materialprocess, //  store JSON here
    });

    handleNext({ materialprocess });
  };

  const onSaveDraftClick = () => {
    const materialprocess = formData.materialGroups.map((group, groupIndex) => {
      const materials = getMaterials(groupIndex);
      const firstMaterial = materials[0] || {};
      return {
        material_group_id: group.group_id || groupIndex + 1,
        material_group_name: group.group_name,
        material_total: firstMaterial.final_total || 0,
        material_unit: firstMaterial.material_type === "sheet" ? "Sheet" : "Pcs",
        material_input: group.materials[0].input,
        processes: (selectedProcesses[groupIndex] || []).map((p) => ({
          process_id: p.processId,
          process_index: p.processIndex,
          process_name: p.processName,
          department: p.department,
          prompt: p.prompt || "",
          input: p.input,
          row_type: p.rowType,
          outsource: Number(p.outsource || 0),
          outsource_type: p.outsourceType || "",
          outsource_rate: p.outsourceRate,
          vendor: p.vendor || "",
          rate: Number(p.rate),
          inhouse: p.inhouse,
          current_total_material: p.currentTotalMaterial,
          job_metric: p.jobMetric,
          order_qty: p.orderQty,
          unit_cost: Number(p.unitCost),
          job_cost: Number(p.jobCost),
        })),
      };
    });

    handleSaveDraft({ materialprocess });
  };

  const processGrandTotals = selectedProcesses.reduce(
    (acc, group) => {
      (group || []).forEach((p) => {
        acc.totalUnitCost += Number(p.unitCost || 0);
        acc.totalJobCost += Number(p.jobCost || 0);
      });
      return acc;
    },
    { totalUnitCost: 0, totalJobCost: 0 }
  );

  const formatCurrency = (num) => `₹${Number(num || 0).toFixed(2)}`;

  return (
    <div>
      <div className="flex justify-end mb-4">
        {/* <button
          onClick={handleClearAll}
               disabled={isViewMode}

          className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 transition-colors text-sm font-semibold"
        >
          <span>🔄</span> Refresh All
        </button> */}
        <button
          type="button"
          onClick={handleClearAll}
          className="flex items-center gap-1 text-red-600 hover:text-red-800 transition-colors text-sm font-semibold"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh All
        </button>
      </div>
      {formData.materialGroups.map((group, groupIndex) => (
        <div key={groupIndex} className="group-container mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-xl font-bold uppercase">
              Section {groupIndex + 1}: {group.group_name}
            </div>

            <div className="flex flex-col">
              <FormControl size="small" className="w-48">
                <Autocomplete
                  value={selectedProcessDropdown[groupIndex] || null}
                  disabled={isViewMode}

                  onChange={(event, newValue) => {
                    setSelectedProcessDropdown((prev) => ({ ...prev, [groupIndex]: newValue }));
                    if (newValue) addProcessToGroup(groupIndex, newValue.id);
                  }}
                  options={processes}
                  getOptionLabel={(option) => option?.name || ""}
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                  noOptionsText="No processes found"
                  renderInput={(params) => (
                    <TextField {...params} label="Process" variant="outlined" size="small" />
                  )}
                />
              </FormControl>
            </div>

          </div>

          <div>

            {getMaterials(groupIndex).length > 0 && (() => {
              const firstMaterial = getMaterials(groupIndex)[0];
              return (
                <div className="w-full bg-blue-50 rounded-lg px-4 py-3 flex justify-between items-center shadow-sm mt-2">
                  {/* Left side */}
                  <span className="text-blue-600 font-semibold text-sm uppercase">
                    Process Base Quantity :
                  </span>

                  {/* Right side */}
                  <span className="bg-white text-blue-600 font-bold text-sm px-3 py-1 rounded shadow-sm">
                    {firstMaterial.final_total || 0}{" "}
                    {firstMaterial.material_type === "sheet" ? "Sheet" : "Pcs"}
                  </span>
                </div>
              );
            })()}


          </div>



          <div className="processes">
            <div className="w-full overflow-x-auto">
              <table className="min-w-[900px] w-full table-auto">
                {/* <table className="w-full table-auto"> */}
                <thead>
                  <tr>
                    <th className="border px-2 py-1 text-sm">#</th>
                    <th className="border px-2 py-1 text-sm">Process</th>
                    <th className="border px-2 py-1 text-sm">Input</th>
                    <th className="border px-2 py-1 text-sm">Inhouse Rate</th>
                    <th className="border px-2 py-1 text-sm">Type</th>
                    <th className="border px-2 py-1 text-sm">Qty</th>
                    <th className="border px-2 py-1 text-sm">Outsource</th>
                    <th className="border px-2 py-1 text-sm">Outsource Rate</th>
                    <th className="border px-2 py-1 text-sm">Vendor</th>
                    <th className="border px-2 py-1 text-sm">Unit Cost</th>
                    <th className="border px-2 py-1 text-sm">Job Cost</th>
                    <th className="border px-2 py-1 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProcesses[groupIndex]?.length > 0 && selectedProcesses[groupIndex]?.map((process, processIndex) => {
                    const baseIndex = getBaseIndex(process.processIndex);

                    const alreadySplit = isProcessAlreadySplit(
                      selectedProcesses[groupIndex],
                      baseIndex
                    );

                    const firstMaterial = getMaterials(groupIndex)[0];
                    const isUV = process.processName.toLowerCase().includes("uv");
                    // const isSheetPasting = process.processName === "Sheet Pasting" || process.processName === "Shimmer Pasting";

                    const isFullyOutsourceEnabled =
                      process.rowType === "Outsource" &&
                      Number(process.outsource) > 0 &&
                      !isSplitRow(process.processIndex);

                    const masterProcess = processes.find(p => p.id === process.processId || p._id === process.processId);
                    const isOutsourceOpen = masterProcess?.is_outsource_open;
                    return (
                      <tr key={processIndex}>
                        <td className="border px-2 py-1 text-sm">{process.processIndex}</td>
                        <td className="border px-2 py-1 text-sm">{process.processName}</td>
                        <td className="border px-2 py-1 text-sm">
                          {isUV ? (
                            <>
                              <div className="flex flex-row gap-1 items-center">
                                <input
                                  type="text"
                                  placeholder="L (in)"
                                  value={process.input?.length ?? ""}
                                  disabled={firstMaterial.material_type === "sheet"}
                                  readOnly={firstMaterial.material_type === "sheet"}
                                  onChange={(e) =>
                                    handleProcessDetailsChange(
                                      groupIndex,
                                      processIndex,
                                      "input",
                                      { ...process.input, baselength: e.target.value, length: e.target.value },
                                      "edit"
                                    )
                                  }
                                  onBlur={(e) =>
                                    handleProcessDetailsChange(
                                      groupIndex,
                                      processIndex,
                                      "input",
                                      { ...process.input, baselength: e.target.value, length: e.target.value },
                                      "calculate"
                                    )
                                  }
                                  className="w-14 p-1 border rounded"
                                />

                                <input
                                  type="text"
                                  placeholder="W (in)"
                                  value={process.input?.width || ""}
                                  disabled={firstMaterial.material_type === "sheet"}
                                  readOnly={firstMaterial.material_type === "sheet"}
                                  onChange={(e) =>
                                    handleProcessDetailsChange(
                                      groupIndex,
                                      processIndex,
                                      "input",
                                      { ...process.input, basewidth: e.target.value, width: e.target.value },
                                      "edit"
                                    )
                                  }
                                  onBlur={(e) =>
                                    handleProcessDetailsChange(
                                      groupIndex,
                                      processIndex,
                                      "input",
                                      { ...process.input, basewidth: e.target.value, width: e.target.value },
                                      "calculate"
                                    )
                                  }
                                  className="w-14 p-1 border rounded"
                                />
                              </div>
                              <div className="flex flex-row gap1 pt-1 items-center">
                                <div className="flex flex-col items-start">
                                  {/* <label className="text-[10px] text-gray-500 leading-none mb-1">
                                    Length Gap(in)
                                  </label> */}
                                  <input
                                    type="text"
                                    placeholder="L_G (in)"
                                    value={process.input?.length_gap ?? ""}
                                    disabled={isViewMode}

                                    onChange={(e) =>
                                      handleProcessDetailsChange(
                                        groupIndex,
                                        processIndex,
                                        "input",
                                        { ...process.input, length_gap: e.target.value },
                                        "edit"
                                      )
                                    }
                                    onBlur={(e) =>
                                      handleProcessDetailsChange(
                                        groupIndex,
                                        processIndex,
                                        "input",
                                        { ...process.input, length_gap: e.target.value },
                                        "calculate"
                                      )
                                    }
                                    className="w-14 p-1 border rounded"
                                  />
                                </div>


                                <div className="flex flex-col items-start">

                                  {/* <label className="text-[10px] text-gray-500 leading-none mb-1">
                                    Width Gap(in)
                                  </label> */}
                                  <input
                                    type="text"
                                    placeholder="W_G (in)"
                                    value={process.input?.width_gap ?? ""}
                                    disabled={isViewMode}

                                    onChange={(e) =>
                                      handleProcessDetailsChange(
                                        groupIndex,
                                        processIndex,
                                        "input",
                                        { ...process.input, width_gap: e.target.value },
                                        "edit"
                                      )
                                    }
                                    onBlur={(e) =>
                                      handleProcessDetailsChange(
                                        groupIndex,
                                        processIndex,
                                        "input",
                                        { ...process.input, width_gap: e.target.value },
                                        "calculate"
                                      )
                                    }
                                    className="w-14 p-1 border rounded"
                                  />
                                </div>

                                <div className="flex flex-col items-start">
                                  {/* <label className="text-[10px] text-gray-500 leading-none mb-1">
                                    Total sqin
                                  </label> */}
                                  <input
                                    type="text"
                                    placeholder="Sq.In"
                                    value={process.input?.actual_input ?? ""}
                                    disabled
                                    className="w-16 p-1 border rounded bg-gray-100"
                                  />
                                </div>

                              </div>
                            </>
                          ) : (
                            process.input?.actual_input
                          )}
                        </td>
                        <td className="border px-2 py-1 text-sm">{process.rate}</td>
                        <td className="border px-2 py-1 text-sm">{process.rowType}</td>
                        <td className="border px-2 py-1 text-sm">{process.currentTotalMaterial}</td>
                        <td className="border px-2 py-1 text-sm">
                          <div className="flex gap-2 items-center">
                            <FormControlLabel
                              control={
                                <Switch checked={(process.outsource === 100 || process.outsource === process.currentTotalMaterial) ? true : false}
                                  disabled={alreadySplit || isViewMode || !isOutsourceOpen}
                                  onChange={(e) => handleProcessDetailsChange(groupIndex, processIndex, "outsourcetoggle", { outsource: process.currentTotalMaterial, outsourceType: "qty", checked: e.target.checked }, "calculate")}
                                  name="outsource" />
                              }
                              label="Fully Outsource"
                            />
                            {Number(formData.jobQty) > 1 && isOutsourceOpen && (
                              <button
                                disabled={alreadySplit || isFullyOutsourceEnabled || isViewMode}
                                onClick={() => setSplitModalData({ process, groupIndex, processIndex })}
                                className="px-2 py-1 text-xs bg-green-600 text-white rounded"
                              >
                                Split
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="border px-2 py-1 text-sm"><div className="flex gap-2 items-center">
                          <input
                            type="number"
                            value={process.outsourceRate || ""}
                            disabled={process.rowType === "Inhouse"}
                            onChange={(e) => handleProcessDetailsChange(groupIndex, processIndex, "outsourceRate", e.target.value, "edit")}
                            onBlur={(e) => handleProcessDetailsChange(groupIndex, processIndex, "outsourceRate", e.target.value, "calculate")}
                            className="w-20 p-2 rounded border bg-white"
                          />
                        </div></td>
                        <td className="border px-2 py-1 text-sm">
                          <input
                            type="text"
                            value={process.vendor || ""}
                            disabled={process.rowType === "Inhouse"}
                            onChange={(e) => handleProcessDetailsChange(groupIndex, processIndex, "vendor", e.target.value, "edit")}
                            onBlur={(e) => handleProcessDetailsChange(groupIndex, processIndex, "vendor", e.target.value, "edit")}
                            placeholder="Vendor"
                            className="w-full p-2 rounded border bg-white"
                          />
                        </td>
                        <td className="border px-2 py-1 text-sm">{process.unitCost}</td>
                        <td className="border px-2 py-1 text-sm">{process.jobCost}</td>
                        <td className="border px-2 py-1 text-sm">
                          <button onClick={() => removeProcessFromGroup(groupIndex, processIndex)} disabled={isViewMode} className="text-red-600">
                            X
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}

      <div className="flex justify-center w-full mt-9">
        <div className="rounded-xl shadow-lg px-16 py-10 max-w-3xl w-full bg-black">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-8 text-white">

            <div className="flex flex-col items-center flex-1 pr-0 sm:pr-8 sm:border-r border-gray-700">
              <div className="text-sm font-medium text-gray-300 mb-2">
                Total Unit Cost
              </div>
              <div className="text-3xl font-extrabold text-white">
                {formatCurrency(processGrandTotals.totalUnitCost)}
              </div>
            </div>

            <div className="flex flex-col items-center flex-1 pl-0 sm:pl-8">
              <div className="text-sm font-medium text-gray-300 mb-2">
                Total Job Cost
              </div>
              <div className="text-3xl font-extrabold text-white">
                {formatCurrency(processGrandTotals.totalJobCost)}
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <button onClick={handleBack} className="px-4 py-2 rounded-md bg-orange-500 text-white border border-orange-600 hover:bg-orange-600">
          Back
        </button>
        {!isViewMode && (
          <button
            onClick={onSaveDraftClick}
            className="px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save as Draft"}
          </button>
        )}
        <button onClick={onNextClick} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">
          Next
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/50 z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Process Input</h3>
            <p className="mb-2">{modalPrompt}</p>
            <input
              type="number"
              value={modalValue}
              onChange={(e) => setModalValue(e.target.value)}
              placeholder="Enter value"
              className="border rounded px-3 py-2 w-full"
            />
            <div className="flex justify-end mt-4">
              <button onClick={handleModalSubmit} className="px-4 py-2 bg-blue-600 text-white rounded">
                OK
              </button>
              <button onClick={() => setIsModalOpen(false)} className="ml-2 px-4 py-2 border rounded text-gray-600">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {splitModalData && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/50 z-50">
          <SplitModal process={splitModalData.process} groupIndex={splitModalData.groupIndex} processIndex={splitModalData.processIndex} />
        </div>
      )}
    </div>
  );
}
