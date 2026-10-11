import React from "react";
import { downloadHonsheetPDF } from "../../../reducer/bomReducer";
import { useDispatch } from "react-redux";
import { downloadJobSheetExcel } from "../../../utils/helper/excelExportHelper";

export default function JobSheet({ handleNext, handleBack, handleSaveDraft, formData, setFormData, isViewMode }) {
  const { materialSpecification = [], materialprocess = [], packingdatas = [], jobQty, productName, subJobNo, materialGroups = [] } = formData || {};
  const dispatch = useDispatch();

  const formatQty = (item) => {
    if (item.material_type === "sheet") return `${item.final_total || 0} sheet`;
    return `${item.final_total || 0} pcs`;
  };

  const buildPayload = () => ({
    product_name: formData.productName,
    job_quantity: formData.jobQty,
    sub_job_no: formData.subJobNo,
    reference_no: formData.reference_no,
    jobDescription: formData.jobDescription,
    orgimage: formData.orgimage,
    materialSpecification: formData.materialSpecification,
    materialprocess: formData.materialprocess,
    packingdatas: formData.packingdatas,
    materialGroups: formData.materialGroups,
  });

  const generateJobSheet = async () => {
    try {
      await dispatch(downloadHonsheetPDF({ payload: buildPayload(), mode: "download" })).unwrap();
    } catch {
      alert("Failed to generate job sheet PDF");
    }
  };

  const handleDownloadExcel = () => {
    const bomData = {
      product_name: productName,
      job_quantity: jobQty,
      job_no: formData.jobNo || formData.job_no || "-",
      sub_job_no: subJobNo || "-",
      material_specification: materialSpecification,
      materialprocess: materialprocess,
      packingdatas: packingdatas
    };
    downloadJobSheetExcel(bomData);
  };

  const printJobSheet = async () => {
    try {
      await dispatch(downloadHonsheetPDF({ payload: buildPayload(), mode: "print" })).unwrap();
    } catch {
      alert("Failed to print job sheet");
    }
  };

  const onNextClick = () => {
    handleNext({ jobSheet: buildPayload() });
  };

  const onSaveDraftClick = () => {
    handleSaveDraft({ jobSheet: buildPayload() });
  };

  const materialGroupMap = {};
  materialGroups.forEach((group) => {
    materialGroupMap[group.group_name] = group.materials?.[0] || {};
  });

  const departmentMap = {};
  materialprocess.forEach((group) => {
    group.processes?.forEach((proc) => {
      const dept = proc.department || "Other";
      if (!departmentMap[dept]) departmentMap[dept] = [];
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
    if (!departmentMap["Assembly"]) departmentMap["Assembly"] = [];
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
    <div className="flex flex-col p-6 bg-gray-50">
      <div className="mb-4">
        <div className="flex justify-between items-start">
          <h1 className="text-2xl font-bold">PRODUCTION JOB SHEET</h1>
          <div className="text-right">
            <p>
              <span className="font-bold">Product Name:</span>
              <span style={{ color: "#4f46e5", padding: "4px 8px", borderRadius: "4px", marginLeft: "6px", fontWeight: "bold" }}>
                {productName || "-"}
              </span>
            </p>
            <p>
              <span className="font-bold">Total Qty:</span>
              <span style={{ color: "#4f46e5", padding: "4px 8px", borderRadius: "4px", marginLeft: "6px", fontWeight: "bold" }}>
                {jobQty || "-"}
              </span>
            </p>
          </div>
        </div>
        <div className="mt-3 h-2 w-full bg-violet-700 rounded"></div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2 bg-blue-100 p-2">1. Material Requisition</h2>
        {materialSpecification.length === 0 ? (
          <p>No raw materials added.</p>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="min-w-[900px] w-full table-auto border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-1 text-left">Material Name</th>
                  <th className="border px-2 py-1 text-left">Size</th>
                  <th className="border px-2 py-1 text-left">Alias / Custom</th>
                  <th className="border px-2 py-1 text-left">Color</th>
                  <th className="border px-2 py-1 text-left">Qty</th>
                </tr>
              </thead>
              <tbody>
                {materialSpecification.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border px-2 py-1">{item.material_name || "-"}</td>
                    <td className="border px-2 py-1">{item.input?.size || "-"}</td>
                    <td className="border px-2 py-1">{item.alias || "-"}</td>
                    <td className="border px-2 py-1">{item.color || "-"}</td>
                    <td className="border px-2 py-1">{formatQty(item)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2 bg-blue-100 p-2">2. Process Workflow</h2>
        {materialprocess.length === 0 ? (
          <p>No processes added.</p>
        ) : (
          materialprocess.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-6">
              <h3 className="font-semibold text-blue-700 mb-2">Section: {group.material_group_name}</h3>
              <div className="w-full overflow-x-auto">
                <table className="min-w-[900px] w-full table-auto border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-2 py-1 text-left w-[10%]">#</th>
                      <th className="border px-2 py-1 text-left w-[60%]">Process Name</th>
                      <th className="border px-2 py-1 text-left w-[30%]">Input</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.processes.map((proc, procIndex) => (
                      <tr key={procIndex}>
                        <td className="border px-2 py-1 w-[10%]">{proc.process_index}</td>
                        <td className="border px-2 py-1 w-[60%] truncate">{proc.process_name || "-"}</td>
                        <td className="border px-2 py-1 w-[30%]">{proc.input.actual_input ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2 bg-blue-100 p-2">3. Packing Instructions</h2>
        {packingdatas.length === 0 ? (
          <p>No packing data added.</p>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="min-w-[900px] w-full table-auto border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-1 text-left">Item</th>
                  <th className="border px-2 py-1 text-left">Spec</th>
                  <th className="border px-2 py-1 text-right">Total Qty</th>
                </tr>
              </thead>
              <tbody>
                {packingdatas.map((pack, idx) => (
                  <tr key={idx}>
                    <td className="border px-2 py-1">{pack.name || "-"}</td>
                    <td className="border px-2 py-1">
                      {pack.itemType === "logic"
                        ? `${pack.logic1 || 1} x ${pack.logic2 || 1} x ${pack.logic3 || 1}`
                        : pack.qty || "-"}
                    </td>
                    <td className="border px-2 py-1 text-right">
                      {pack.itemType === 'logic' ? pack.total_qty.toLocaleString() : (pack.total_qty || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex justify-center space-x-4 mt-6">
        <button onClick={generateJobSheet} className="px-4 py-2 text-white rounded font-semibold bg-indigo-600 hover:bg-indigo-700">
          Download Job Sheet
        </button>
        <button onClick={handleDownloadExcel} className="px-4 py-2 text-white rounded font-semibold bg-cyan-600 hover:bg-cyan-700">
          Download Job Sheet Excel
        </button>
        <button onClick={printJobSheet} className="px-4 py-2 text-white rounded font-semibold bg-green-600 hover:bg-green-700">
          Print Job Sheet
        </button>
      </div>

      <div className="mt-12">
        <h2 className="text-lg font-semibold mb-4">Department-wise Process Job Sheet</h2>
        {Object.entries(departmentMap).map(([department, processes]) => (
          <div key={department} className="mb-8 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-md font-bold text-indigo-700 mb-2 underline">Department: {department}</h3>
            <div className="w-full overflow-x-auto">
              <table className="min-w-[900px] w-full table-auto border border-gray-300 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-2 py-1">Sr. No</th>
                    <th className="border px-2 py-1 text-left">Process Name</th>
                    <th className="border px-2 py-1 text-left">Alias</th>
                    <th className="border px-2 py-1">Job Qty</th>
                    <th className="border px-2 py-1">Inhouse / Outsource</th>
                    <th className="border px-2 py-1">Vendor</th>
                    <th className="border px-2 py-1">Material Type</th>
                    <th className="border px-2 py-1">Size</th>
                    <th className="border px-2 py-1">Qty</th>
                    <th className="border px-2 py-1">UPS</th>
                    <th className="border px-2 py-1">Input</th>
                  </tr>
                </thead>
                <tbody>
                  {processes.map((proc, idx) => {
                    const material = materialGroupMap[proc.material_group_name] || {};
                    return (
                      <tr key={idx} className="bg-white">
                        <td className="border px-2 py-1 text-center">{proc.process_index}</td>
                        <td className="border px-2 py-1">{proc.process_name}</td>
                        <td className="border px-2 py-1 text-blue-600">{proc.material_group_name}</td>
                        <td className="border px-2 py-1 text-center">{formData.jobQty || proc.order_qty}</td>
                        <td className="border px-2 py-1">{proc.row_type}</td>
                        <td className="border px-2 py-1 text-center">{proc.vendor || "-"}</td>
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
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
