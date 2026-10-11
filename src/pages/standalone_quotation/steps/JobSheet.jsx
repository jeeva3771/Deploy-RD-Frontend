import React from "react";
// import { generateJobSheet } from "./generateJobSheet";
import { downloadHonsheetPDF } from "../../../reducer/standalone_bomReducer";
import { useDispatch } from "react-redux";
import { downloadJobSheetExcel } from "../../../utils/helper/excelExportHelper";

export default function JobSheet({  handleNext, handleBack, formData, setFormData, isViewMode, handleSaveDraft, isSubmitting  }) {
  const { materialSpecification = [], materialprocess = [], packingdatas = [], jobQty, productName, subJobNo , materialGroups =[]} = formData || {};

  const formatQty = (item) => {
    if (item.material_type === "sheet") return `${item.final_total || 0} sheet`;
    return `${item.final_total || 0} pcs`;
  };

  // console.log("formDataformDataformDataformData------------------------",formData)


  const dispatch = useDispatch();
  
const buildPayload = () => {
  const formDataPayload = new FormData();

  formDataPayload.append("product_name", formData.productName);
  formDataPayload.append("job_quantity", formData.jobQty);
  formDataPayload.append("sub_job_no", formData.subJobNo);
  formDataPayload.append("reference_no", formData.reference_no || "");
  formDataPayload.append("jobDescription", formData.jobDescription);

  formDataPayload.append(
    "materialSpecification",
    JSON.stringify(formData.materialSpecification)
  );
  formDataPayload.append(
    "materialprocess",
    JSON.stringify(formData.materialprocess)
  );
  formDataPayload.append(
    "packingdatas",
    JSON.stringify(formData.packingdatas)
  );
  formDataPayload.append(
    "materialGroups",
    JSON.stringify(formData.materialGroups)
  );

  if (formData.imageFile instanceof File) {
    formDataPayload.append("image", formData.imageFile);
  } else if (formData.orgimage) {
    formDataPayload.append("orgimage", formData.orgimage);
  }

  return formDataPayload;
};

  
  const generateJobSheet = async () => {
    try {
      await dispatch(
        downloadHonsheetPDF({
          payload: buildPayload(),
          mode: "download",
        })
      ).unwrap();
    } catch {
      alert("Failed to generate quotation PDF");
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
      await dispatch(
        downloadHonsheetPDF({
          payload: buildPayload(),
          mode: "print",
        })
      ).unwrap();
    } catch {
      alert("Failed to print quotation");
    }
  };
  

const onNextClick = () => {
  const updatedMaterials = materialSpecification.map((item) => {
    let jobTotal = 0;
    let unitRate = 0;

    if (item.material_type === "sheet") {
      const [width, height] = item.input.size.split("x").map(Number);
      const sizeMultiplier = width * height;
      jobTotal = item.rate * sizeMultiplier * item.final_total;
      unitRate = jobTotal / (formData.jobQty || 1);
    } else {
      jobTotal = item.rate * (formData.jobQty || 1);
      unitRate = item.rate;
    }

    return {
      ...item,
      unitRate,
      jobTotal,
    };
  });

  // Update processes
  const updatedProcesses = materialprocess.map((proc) => ({
    ...proc,
    unitRate: proc.unitCost,
    jobTotal: proc.finaltotal,
  }));

  // Update packing
  const updatedPacking = packingdatas.map((pack) => ({
    ...pack,
    jobTotal: pack.finaltotal,
  }));

  const jobSheetData = {
    materialSpecification: updatedMaterials,
    materialprocess: updatedProcesses,
    packingdatas: updatedPacking,
  };

  // Update formData with latest job sheet values
  setFormData({
    ...formData,
    jobSheet: jobSheetData,
  });

  handleNext({ jobSheet: jobSheetData });
};

const normalizeName = (name = "") =>
  name
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const PROCESS_BOXES = [
  { key: "laser cutting co2", title: "Laser Cutting CO2" },
  { key: "uv printing hantop", title: "UV PRINTING HANTOP" },
  { key: "uv printing mimaki", title: "UV PRINTING MIMAKI" },
  { key: "labour", title: "Labour" },
];


const consolidatedBoxes = PROCESS_BOXES.map((box) => {
  const groups = [];

  materialprocess.forEach((group) => {
    const matched = group.processes?.filter((proc) =>
      normalizeName(proc.process_name).includes(box.key)
    );

    if (matched?.length) {
      groups.push({
        groupName: group.material_group_name,
        rows: matched.map((proc) => ({
          input: proc.input.actual_input,
          type: proc.row_type === "Outsource" ? "Outsource" : "Inhouse",
        })),
        material_total: group.material_total,
        material_unit: group.material_unit,
      });
    }
  });

  // Packing → Labour
  if (box.key === "labour") {
    const packingLabour = packingdatas.filter((pack) =>
      normalizeName(pack.name).includes("labour")
    );

    if (packingLabour.length) {
      groups.push({
        groupName: "Packing",
        rows: packingLabour.map((pack) => ({
          input: pack.qty || "-",
          type: "Packing",
        })),
      });
    }
  }

  return {
    title: box.title,
    groups,
  };
});

console.log("consolidatedBoxes",consolidatedBoxes)




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

// 🔹 ADD PACKING AS ASSEMBLY DEPARTMENT
packingdatas.forEach((pack) => {
  const isPackingLabour =
    pack.name?.toLowerCase().includes("labour");

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
    
    <div className="flex flex-col p-6 bg-gray-50">
      {/* Header */}
<div className="mb-4">
  <div className="flex justify-between items-start">

    <h1 className="text-2xl font-bold">PRODUCTION JOB SHEET</h1>

    {/* Right: Product info */}
    <div className="text-right">
   <p>
  <span className="font-bold">Product Name:</span>
  <span
    style={{
      color: "#4f46e5",
      padding: "4px 8px",
      borderRadius: "4px",
      marginLeft: "6px",
      fontWeight: "bold",
    }}
  >
    {productName || "-"}
  </span>
</p>

<p>
  <span className="font-bold">Total Qty:</span>
  <span
    style={{
      color: "#4f46e5",
      padding: "4px 8px",
      borderRadius: "4px",
      marginLeft: "6px",
      fontWeight: "bold",
    }}
  >
    {jobQty || "-"}
  </span>
</p>


    </div>
  </div>


  <div className="mt-3 h-2 w-full bg-violet-700 rounded"></div>
</div>




      {/* 1. Material Requisition */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2 bg-blue-100 p-2">1. Material Requisition</h2>
        {materialSpecification.length === 0 ? (
          <p>No raw materials added.</p>
        ) : (

                <div className="w-full overflow-x-auto">
  <table className="min-w-[900px] w-full table-auto border border-gray-300">
          {/* <table className="w-full table-auto border border-gray-300"> */}
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
                  <td className="border px-2 py-1">  {item.input?.size || "-"}</td>
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

      {/* 2. Process Workflow */}
        <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2 bg-blue-100 p-2">
            2. Process Workflow
        </h2>

        {materialprocess.length === 0 ? (
            <p>No processes added.</p>
        ) : (
            materialprocess.map((group, groupIndex) => (
            <div key={group.material_group_id} className="mb-6">
                {/* Group Header */}
                <h3 className="font-semibold text-blue-700 mb-2">
                Section: {group.material_group_name}
                </h3>

                                <div className="w-full overflow-x-auto">
  <table className="min-w-[900px] w-full table-auto border border-gray-300">

                {/* <table className="w-full table-fixed border border-gray-300"> */}
                <thead className="bg-gray-100">
                    <tr>
                    <th className="border px-2 py-1 text-left w-[10%]">#</th>
                    <th className="border px-2 py-1 text-left w-[60%]">
                        Process Name
                    </th>
                    <th className="border px-2 py-1 text-left w-[30%]">
                        Input
                    </th>
                    </tr>
                </thead>

                <tbody>
                    {group.processes.map((proc, procIndex) => (
                    <tr key={procIndex}>
                        <td className="border px-2 py-1 w-[10%]">
                        {/* {groupIndex + 1}.{procIndex + 1} */}
                          {proc.process_index}

                        </td>

                        <td className="border px-2 py-1 w-[60%] truncate">
                          {proc.process_name || "-"}
                        </td>

                        <td className="border px-2 py-1 w-[30%]">
                          {proc.input.actual_input ?? "-"}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            </div>
            ))
        )}
        </div>



      {/* 3. Packing Instructions */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2 bg-blue-100 p-2">3. Packing Instructions</h2>
        {packingdatas.length === 0 ? (
          <p>No packing data added.</p>
        ) : (
                          <div className="w-full overflow-x-auto">
  <table className="min-w-[900px] w-full table-auto border border-gray-300">
          {/* <table className="w-full table-auto border border-gray-300"> */}
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-1 text-left">Item</th>
                <th className="border px-2 py-1 text-left">Spec / Qty</th>
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
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>


      <div className="flex justify-center space-x-4 mt-6">
        <button
          // onClick={() => generateJobSheet(formData)}
            onClick={generateJobSheet}


       className="px-4 py-2 text-white rounded"
        style={{ fontWeight: 600, backgroundColor: "#4f46e5" }}
        >
          Download Job Sheet
        </button>

        <button
          onClick={handleDownloadExcel}
          className="px-4 py-2 text-white rounded"
          style={{ fontWeight: 600, backgroundColor: "#0891b2" }}
        >
          Download Job Sheet Excel
        </button>
        
        <button
        //  onClick={() => generateJobSheet(formData, true)}
            onClick={printJobSheet}

        className="px-4 py-2 text-white rounded"
        style={{ fontWeight: 600, backgroundColor: "#16a34a" }}
      >
        Print Job Sheet
      </button>


  




      </div>


{/* <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {consolidatedBoxes
    .filter(box =>
      box.groups?.some(group =>
        group.rows?.some(row => row.input || row.type)
      )
    )
    .map((box, idx) => (
      <div
        key={idx}
        className="border rounded-lg shadow-sm px-4 py-3 bg-white"
        style={{ borderColor: "#4f46e5" }}
      >
        <div
          className="text-center mb-3 text-sm font-semibold"
          style={{ color: "#4f46e5" }}
        >
          {box.title}
        </div>

        <div className="space-y-3">
          {box.groups
            .filter(group =>
              group.rows?.some(row => row.input || row.type)
            )
            .map((group, gIdx) => (
              <div key={gIdx}>
                <div className="flex justify-between items-center text-xs font-semibold text-gray-600 mb-2">
     <div className="flex-1 text-center">
      {group.groupName}
    </div>
    <div>
      {group.material_total} {group.material_unit}
    </div>
  </div>

                <div className="space-y-2">
                  {group.rows
                    .filter(row => row.input || row.type)
                    .map((row, rIdx) => (
                      <div
                        key={rIdx}
                        className="flex items-center gap-2 text-xs border rounded px-2 py-1"
                      >
                        <div className="flex-1 border-r border-gray-200 pr-2 text-center">
                          <div className="font-medium text-gray-500">
                            Input
                          </div>
                          <div
                            className="font-semibold"
                            style={{ color: "#4f46e5" }}
                          >
                            {row.input}
                          </div>
                        </div>

                        <div className="flex-1 pl-2 text-center">
                          <div className="font-medium text-gray-500">
                            Type
                          </div>
                          <div
                            className="font-semibold"
                            style={{ color: "#4f46e5" }}
                          >
                            {row.type}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    ))}
</div> */}


<div className="mt-12">
  <h2 className="text-lg font-semibold mb-4">
 Department-wise Process Job Sheet
  </h2>

  {Object.entries(departmentMap).map(([department, processes]) => (
    <div key={department} className="mb-8">

      <h3 className="text-md font-bold text-indigo-700 mb-2">
        Department: {department}
      </h3>

                <div className="w-full overflow-x-auto">
  <table className="min-w-[900px] w-full table-auto border border-gray-300 text-sm">
      {/* <table className="w-full table-auto border border-gray-300 text-sm"> */}
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
          </tr>
        </thead>

        <tbody>
          {processes.map((proc, idx) => {
            const material =
              materialGroupMap[proc.material_group_name] || {};

            return (
              <tr key={idx}>
                <td className="border px-2 py-1">
                  {proc.process_index}
                </td>

                <td className="border px-2 py-1">
                  {proc.process_name}
                </td>

                <td className="border px-2 py-1 text-blue-600 font-medium">
                  {proc.material_group_name}
                </td>

                <td className="border px-2 py-1 text-center">
                  {formData.jobQty || proc.order_qty}
                </td>

                <td className="border px-2 py-1">
                  {proc.row_type}
                </td>

                <td className="border px-2 py-1">
                  {proc.vendor || "-"}
                </td>

                <td className="border px-2 py-1">
                  {material.material_name || "-"}
                </td>

                <td className="border px-2 py-1">
                  {material.input?.size || "-"}
                </td>

                <td className="border px-2 py-1 text-center">
                  {proc.current_total_material || "-"} {proc.material_unit || ""}
                </td>

                <td className="border px-2 py-1 text-center">
                  {material.input?.ups || "-"}
                </td>

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
        <button onClick={handleBack}      className="px-4 py-2 rounded-md bg-orange-500 text-white border border-orange-600 hover:bg-orange-600">
          Back
        </button>

        {!isViewMode && (
          <button
            onClick={() => handleSaveDraft({ jobSheet: formData.jobSheet })}
            className="px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save as Draft"}
          </button>
        )}
    
        <button  onClick={onNextClick} 
   
        className="px-4 py-2 bg-blue-600 text-white rounded">
          Next
        </button>
      </div>



    </div>
  );
}
