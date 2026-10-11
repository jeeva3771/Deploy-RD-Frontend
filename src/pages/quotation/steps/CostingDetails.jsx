import React from "react";
import { generateJobSheet } from "./generateJobSheet";
import { generateCostSheet as generateCostSheetPDF } from "./generateCostSheet";
import { downloadCostSheetExcel } from "../../../utils/helper/excelExportHelper";

export default function CostingDetails({ handleNext, handleBack, handleSaveDraft, formData, setFormData }) {
  const { materialSpecification = [], materialprocess = [], packingdatas = [], materialGroups = [] } = formData || {};

  const toNumber = (val) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  // Helper to round numbers to 2 decimals
  const toFixedNumber = (num, decimals = 2) => {
    return Number(Number(num).toFixed(decimals));
  };

  const grandTotals = {
    totalUnitCost: 0,
    totalJobCost: 0,
  };

  /* RAW MATERIAL */
  materialSpecification.forEach((item) => {
    let jobTotal = 0;
    let unitRate = 0;

    if (item.material_type === "sheet" && item.input?.size) {
      const [width, height] = item.input.size.split("x").map(toNumber);
      const sizeMultiplier = width * height;

      jobTotal = toFixedNumber(toNumber(item.rate) * sizeMultiplier * toNumber(item.final_total));
      unitRate = toFixedNumber(jobTotal / toNumber(formData.jobQty || 1));
    } else {
      jobTotal = toFixedNumber(toNumber(item.rate) * item.final_total);
      unitRate = jobTotal / (formData.jobQty || 1);
    }

    grandTotals.totalUnitCost = toFixedNumber(grandTotals.totalUnitCost + unitRate);
    grandTotals.totalJobCost = toFixedNumber(grandTotals.totalJobCost + jobTotal);
  });

  /* PROCESS */
  materialprocess.forEach((group) => {
    group.processes?.forEach((proc) => {
      const unitCost = toFixedNumber(toNumber(proc.unit_cost));
      const jobCost = toFixedNumber(toNumber(proc.job_cost));

      grandTotals.totalUnitCost = toFixedNumber(grandTotals.totalUnitCost + unitCost);
      grandTotals.totalJobCost = toFixedNumber(grandTotals.totalJobCost + jobCost);
    });
  });

  /* PACKING */
  packingdatas.forEach((pack) => {
    const packUnit = toFixedNumber(toNumber(pack.total));
    const packJob = toFixedNumber(toNumber(pack.finaltotal));

    grandTotals.totalUnitCost = toFixedNumber(grandTotals.totalUnitCost + packUnit);
    grandTotals.totalJobCost = toFixedNumber(grandTotals.totalJobCost + packJob);
  });

  const generateCostSheet = async () => {
    await generateCostSheetPDF(formData, false);
  }

  const printCostSheet = async () => {
    await generateCostSheetPDF(formData, true);
  }

  const handleDownloadExcel = () => {
    const bomData = {
      product_name: formData.productName,
      job_quantity: formData.jobQty,
      job_no: formData.jobNo || formData.job_no || "-",
      sub_job_no: formData.subJobNo || formData.sub_job_no || "-",
      material_specification: materialSpecification,
      materialprocess: materialprocess,
      packingdatas: packingdatas
    };
    downloadCostSheetExcel(bomData);
  };

  const formatCurrency = (num) => `₹${Number(num || 0).toFixed(2)}`;

  const onNextClick = () => {
    // Update materialSpecification with calculated unitRate and jobTotal
    const updatedMaterials = materialSpecification.map((item) => {
      let jobTotal = 0;
      let unitRate = 0;

      if (item.material_type === "sheet" && item.input?.size) {
        const [width, height] = item.input.size.split("x").map(toNumber);
        const sizeMultiplier = width * height;
        jobTotal = toNumber(item.rate) * sizeMultiplier * toNumber(item.final_total);
        unitRate = jobTotal / toNumber(formData.jobQty || 1);
      } else {
        jobTotal = toNumber(item.rate) * toNumber(formData.jobQty || 1);
        unitRate = toNumber(item.rate);
      }

      return { ...item, unitRate, jobTotal, is_inventory_item: item.is_inventory_item };
    });

    // Update processes
    const updatedProcesses = materialprocess.map((group) => ({
      ...group,
      processes: group.processes?.map((proc) => ({
        ...proc,
        unitRate: toNumber(proc.unit_cost),
        jobTotal: toNumber(proc.job_cost),
      })),
    }));

    // Update packing
    const updatedPacking = packingdatas.map((pack) => ({
      ...pack,
      jobTotal: toNumber(pack.finaltotal),
    }));

    const costDetailsData = {
      materialSpecification: updatedMaterials,
      materialprocess: updatedProcesses,
      packingdatas: updatedPacking,
    };

    // Use the grandTotals already calculated for display
    const totalUnitCost = grandTotals.totalUnitCost;
    const totalJobCost = grandTotals.totalJobCost;

    // Update formData
    setFormData({
      ...formData,
      costDetails: costDetailsData,
      totalUnitCost,
      totalJobCost,
    });

    // Pass totals along with costDetails
    handleNext({ costDetails: costDetailsData, totalUnitCost, totalJobCost });
  };

  const onSaveDraftClick = () => {
    // Collect same data as onNextClick
    const updatedMaterials = materialSpecification.map((item) => {
      let jobTotal = 0;
      let unitRate = 0;
      if (item.material_type === "sheet" && item.input?.size) {
        const [width, height] = item.input.size.split("x").map(toNumber);
        const sizeMultiplier = width * height;
        jobTotal = toNumber(item.rate) * sizeMultiplier * toNumber(item.final_total);
        unitRate = jobTotal / toNumber(formData.jobQty || 1);
      } else {
        jobTotal = toNumber(item.rate) * toNumber(formData.jobQty || 1);
        unitRate = toNumber(item.rate);
      }
      return { ...item, unitRate, jobTotal, is_inventory_item: item.is_inventory_item };
    });

    const updatedProcesses = materialprocess.map((group) => ({
      ...group,
      processes: group.processes?.map((proc) => ({
        ...proc,
        unitRate: toNumber(proc.unit_cost),
        jobTotal: toNumber(proc.job_cost),
      })),
    }));

    const updatedPacking = packingdatas.map((pack) => ({
      ...pack,
      jobTotal: toNumber(pack.finaltotal),
    }));

    const costDetailsData = {
      materialSpecification: updatedMaterials,
      materialprocess: updatedProcesses,
      packingdatas: updatedPacking,
    };

    handleSaveDraft({
      costDetails: costDetailsData,
      totalUnitCost: grandTotals.totalUnitCost,
      totalJobCost: grandTotals.totalJobCost,
    });
  };



  const materialGroupMap = {};
  materialGroups.forEach((group) => {
    materialGroupMap[group.group_name] = group.materials?.[0] || {};
  });

  const departmentMap = {};
  materialprocess.forEach((group) => {
    group.processes?.forEach((proc) => {
      const dept = proc.department || "Other";

      if (!departmentMap[dept]) {
        departmentMap[dept] = [];
      }

      departmentMap[dept].push({
        ...proc,
        material_group_name: group.material_group_name,
        material_unit: group.material_unit,
      });
    });
  });

  packingdatas.forEach((pack) => {
    const isPackingLabour = pack.name?.toLowerCase().includes("labour");

    if (!isPackingLabour) return;

    if (!departmentMap["Assembly"]) {
      departmentMap["Assembly"] = [];
    }

    departmentMap["Assembly"].push({
      process_index: "",
      process_name: pack.name,
      department: "Assembly",
      row_type: "Inhouse",
      vendor: "-",
      unit_cost: Number(pack.total || 0),
      job_cost: Number(pack.finaltotal || 0),
      input: "-",
      material_group_name: "Packing",
      order_qty: formData.jobQty,
    });
  });

  const getUnitFromLabel = (label) => {
    const mappings = [
      { keyword: "Enter Minutes per Sheet", unit: "min" },
      { keyword: "TOTAL Sq Inches", unit: "sq in" },
      { keyword: "Enter Cost per Sheet", unit: "pcs" },
      { keyword: "Enter Qty", unit: "pcs" },
    ];

    const found = mappings.find((m) => label.includes(m.keyword));
    return found ? found.unit : "";
  };

  return (
    <div className="space-y-8">
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">
        Costing Details
      </h2>

      <div>
        <h2 className="text-lg font-semibold mb-2">1. Raw Materials</h2>
        {materialSpecification.length === 0 ? (
          <p>No raw materials added.</p>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="min-w-[900px] w-full table-auto">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-1 text-left">Item</th>
                  <th className="border px-2 py-1 text-left">Vendor</th>
                  <th className="border px-2 py-1 text-left">Size</th>
                  <th className="border px-2 py-1 text-left">Req Qty</th>
                  <th className="border px-2 py-1 text-right">Unit Cost</th>
                  <th className="border px-2 py-1 text-right">Job Cost</th>
                </tr>
              </thead>
              <tbody>
                {materialSpecification.map((item, idx) => {
                  let jobTotal = 0;
                  let unitRate = 0;

                  if (item.material_type === "sheet") {
                    const [width, height] = item.input.size.split("x").map(Number);
                    const sizeMultiplier = width * height;
                    jobTotal = (item.rate * sizeMultiplier) * item.final_total;
                    unitRate = jobTotal / (formData.jobQty || 1);
                  } else {
                    jobTotal = item.rate * item.final_total;
                    unitRate = jobTotal / (formData.jobQty || 1);
                  }

                  return (
                    <tr key={idx}>
                      <td className="border px-2 py-1">
                        {item.material_name} {item.alias && <span className="text-blue-600">{item.alias}</span>}
                      </td>
                      <td className="border px-2 py-1 text-right">{item?.vendorName || "-"}</td>
                      <td className="border px-2 py-1 text-right">{item.input?.size || "-"}</td>
                      <td className="border px-2 py-1 text-right">{item.final_total} {item.material_type === "sheet" ? "Sheet" : "Pcs"}</td>
                      <td className="border px-2 py-1 text-right">{formatCurrency(unitRate)}</td>
                      <td className="border px-2 py-1 text-right">{formatCurrency(jobTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">2. Processes</h2>
        {materialprocess.length === 0 ? (
          <p>No processes added.</p>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="min-w-[900px] w-full table-auto border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-1 text-left">#</th>
                  <th className="border px-2 py-1 text-left">Process</th>
                  <th className="border px-2 py-1 text-left">Vendor</th>
                  <th className="border px-2 py-1 text-left">Input</th>
                  <th className="border px-2 py-1 text-right">Unit Cost</th>
                  <th className="border px-2 py-1 text-right">Job Cost</th>
                </tr>
              </thead>
              <tbody>
                {materialprocess.map((group, groupIndex) =>
                  group.processes.map((proc, procIndex) => (
                    <tr key={`${groupIndex}-${procIndex}`}>
                      <td className="border px-2 py-1">{proc.process_index}</td>
                      <td className="border px-2 py-1">
                        {proc.process_name}{" "}
                        <span className="text-blue-600 text-sm">
                          ({group.material_group_name})
                        </span>
                      </td>
                      <td className="border px-2 py-1">{proc?.vendor ?? "-"}</td>
                      <td className="border px-2 py-1">{proc.input.actual_input ?? "-"}</td>
                      <td className="border px-2 py-1 text-right">{formatCurrency(proc.unit_cost)}</td>
                      <td className="border px-2 py-1 text-right">{formatCurrency(proc.job_cost)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">3. Packing</h2>
        {packingdatas.length === 0 ? (
          <p>No packing data added.</p>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="min-w-[900px] w-full table-auto border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-1 text-left">Item</th>
                  <th className="border px-2 py-1 text-right">Total Qty</th>
                  <th className="border px-2 py-1 text-right">Unit Cost</th>
                  <th className="border px-2 py-1 text-right">Job Cost</th>
                </tr>
              </thead>
              <tbody>
                {packingdatas.map((pack, idx) => (
                  <tr key={idx}>
                    <td className="border px-2 py-1">{pack.name}</td>
                    <td className="border px-2 py-1 text-right">{pack.itemType === 'logic' ? pack.total_qty.toLocaleString() : (pack.total_qty || 0).toLocaleString()}</td>
                    <td className="border px-2 py-1 text-right">{formatCurrency(pack.total)}</td>
                    <td className="border px-2 py-1 text-right">{formatCurrency(pack.finaltotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex justify-center w-full mt-9">
        <div className="rounded-xl shadow-lg px-8 sm:px-16 py-10 max-w-3xl w-full bg-black">
          <div className="relative flex flex-col sm:flex-row justify-between items-center gap-8 text-white">
            <div className="hidden sm:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-px bg-gray-700" />
            <div className="flex flex-col items-center flex-1">
              <div className="text-sm font-medium text-gray-300 mb-2">Total Unit Cost</div>
              <div className="text-3xl font-extrabold text-white">{formatCurrency(grandTotals.totalUnitCost)}</div>
            </div>
            <div className="flex flex-col items-center flex-1">
              <div className="text-sm font-medium text-gray-300 mb-2">Total Job Cost</div>
              <div className="text-3xl font-extrabold text-white">{formatCurrency(grandTotals.totalJobCost)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-lg font-semibold mb-4">4. Department-wise Process Job Sheet</h2>
        {Object.entries(departmentMap).map(([department, processes]) => {
          const totalUnitCost = processes.reduce((sum, p) => sum + (Number(p.unit_cost) || 0), 0);
          const totalJobCost = processes.reduce((sum, p) => sum + (Number(p.job_cost) || 0), 0);

          return (
            <div key={department} className="mb-8">
              <h3 className="text-md font-bold text-indigo-700 mb-2">Department: {department}</h3>
              <div className="w-full overflow-x-auto">
                <table className="min-w-[900px] w-full table-auto border border-gray-300 text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-2 py-1">Sr. No</th>
                      <th className="border px-2 py-1">Process Name</th>
                      <th className="border px-2 py-1">Alias</th>
                      <th className="border px-2 py-1">Job Qty</th>
                      <th className="border px-2 py-1">Inhouse / Outsource</th>
                      <th className="border px-2 py-1">Vendor</th>
                      <th className="border px-2 py-1">Material Type</th>
                      <th className="border px-2 py-1">Size</th>
                      <th className="border px-2 py-1">Qty</th>
                      <th className="border px-2 py-1">UPS</th>
                      <th className="border px-2 py-1">Input</th>
                      <th className="border px-2 py-1 text-right">Unit Rate</th>
                      <th className="border px-2 py-1 text-right">Job Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processes.map((proc, idx) => {
                      const material = materialGroupMap[proc.material_group_name] || {};
                      return (
                        <tr key={idx}>
                          <td className="border px-2 py-1">{proc.process_index}</td>
                          <td className="border px-2 py-1">{proc.process_name}</td>
                          <td className="border px-2 py-1 text-blue-600 font-medium">{proc.material_group_name}</td>
                          <td className="border px-2 py-1 text-center">{formData.jobQty || proc.order_qty}</td>
                          <td className="border px-2 py-1">{proc.row_type}</td>
                          <td className="border px-2 py-1">{proc.vendor || "-"}</td>
                          <td className="border px-2 py-1">{material.material_name || "-"}</td>
                          <td className="border px-2 py-1">{material.input?.size || "-"}</td>
                          <td className="border px-2 py-1 text-center">{proc.current_total_material || "-"} {proc.material_unit || ""}</td>
                          <td className="border px-2 py-1 text-center">{material.input?.ups || "-"}</td>
                          <td className="border px-2 py-1 text-center">
                            {(() => {
                              const unit = getUnitFromLabel(proc.prompt || "");
                              return `${proc.input.actual_input || "-"} ${unit || ""}`;
                            })()}
                          </td>
                          <td className="border px-2 py-1 text-right">{formatCurrency(proc.unit_cost)}</td>
                          <td className="border px-2 py-1 text-right">{formatCurrency(proc.job_cost)}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-gray-100 font-bold">
                      <td className="border px-2 py-1" colSpan={11}>Total</td>
                      <td className="border px-2 py-1 text-right">{formatCurrency(totalUnitCost)}</td>
                      <td className="border px-2 py-1 text-right">{formatCurrency(totalJobCost)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center space-x-4 mt-6">
        <button
          onClick={generateCostSheet}
          className="px-4 py-2 text-white rounded font-semibold bg-indigo-600 hover:bg-indigo-700"
        >
          Download Cost Sheet
        </button>
        <button
          onClick={handleDownloadExcel}
          className="px-4 py-2 text-white rounded font-semibold bg-cyan-600 hover:bg-cyan-700"
        >
          Download Cost Sheet Excel
        </button>
        <button
          onClick={printCostSheet}
          className="px-4 py-2 text-white rounded font-semibold bg-green-600 hover:bg-green-700"
        >
          Print Cost Sheet
        </button>
      </div>

      <div className="flex justify-between mt-6">
        <button onClick={handleBack} className="px-4 py-2 rounded-md bg-orange-500 text-white border border-orange-600 hover:bg-orange-600">
          Back
        </button>
        <div className="flex gap-2">
          <button onClick={onSaveDraftClick} className="px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-700">
            Save as Draft
          </button>
          <button onClick={onNextClick} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
