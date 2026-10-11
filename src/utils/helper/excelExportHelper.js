const toNumber = (val) => {
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

const formatCurrency = (val) => {
  const num = Number(val);
  return isNaN(num) ? "₹0.00" : `₹${num.toFixed(2)}`;
};

export const getFileName = (url) => {
  if (!url) return "";
  const withoutParams = url.split("?")[0];
  let name = withoutParams.split("---").pop();
  return decodeURIComponent(name);
};

export const groupProcessesByDepartment = (bomData) => {
  const materialProcesses = bomData?.materialprocess || [];
  const grouped = {};

  materialProcesses.forEach((materialGroup) => {
    const processes = materialGroup.processes || [];
    processes.forEach((process) => {
      const department = process.department || "Uncategorized";
      if (!grouped[department]) {
        grouped[department] = [];
      }
      grouped[department].push({
        ...process,
        material_group_id: materialGroup.material_group_id || materialGroup._id,
        material_group_name: materialGroup.material_group_name,
        material_total: materialGroup.material_total,
        material_unit: materialGroup.material_unit,
        material_input: materialGroup.material_input,
      });
    });
  });

  return grouped;
};

export const downloadCostSheetExcel = (bomData) => {
  if (!bomData) return;
  const materialSpecification = bomData.material_specification || [];
  const materialProcess = bomData.materialprocess || [];
  const packingData = bomData.packingdatas || [];
  const groupedProcesses = groupProcessesByDepartment(bomData);

  const getMaterialCost = (material, idx) => {
    const costItem = bomData.costdetails?.materialSpecification?.[idx] ||
      bomData.costdetails?.materialSpecification?.find(m => m.item_id === material.item_id);

    let unitRate = material.unitRate ?? material.unit_rate ?? costItem?.unitRate ?? costItem?.unit_rate;
    let jobTotal = material.jobTotal ?? material.job_total ?? costItem?.jobTotal ?? costItem?.job_total;

    if (unitRate === undefined || jobTotal === undefined) {
      const rate = toNumber(material.rate || costItem?.rate || 0);
      const final_total = toNumber(material.final_total || costItem?.final_total || 0);
      if (material.material_type === "sheet" && material.input?.size) {
        const [w, h] = material.input.size.split("x").map(toNumber);
        const mult = w * h > 0 ? w * h : 1;
        jobTotal = rate * mult * final_total;
      } else {
        jobTotal = rate * final_total;
      }
      unitRate = jobTotal / toNumber(bomData.job_quantity || 1);
    }
    return { unitRate: toNumber(unitRate), jobTotal: toNumber(jobTotal) };
  };

  const getProcessCost = (process, groupIdx, procIdx) => {
    const costGroup = bomData.costdetails?.materialprocess?.[groupIdx];
    const costProc = costGroup?.processes?.[procIdx] ||
      costGroup?.processes?.find(p => p.process_name === process.process_name);

    const unitRate = process.unit_cost ?? process.unitRate ?? costProc?.unit_cost ?? costProc?.unitRate ?? toNumber(process.rate || costProc?.rate || 0);
    const jobTotal = process.job_cost ?? process.jobTotal ?? costProc?.job_cost ?? costProc?.jobTotal ?? 0;

    return { unitRate: toNumber(unitRate), jobTotal: toNumber(jobTotal) };
  };

  const getPackingCost = (pack, idx) => {
    const costPack = bomData.costdetails?.packingdatas?.[idx] ||
      bomData.costdetails?.packingdatas?.find(p => p.name === pack.name);

    const unitRate = pack.total ?? pack.unitCost ?? costPack?.total ?? costPack?.unitCost ?? 0;
    const jobTotal = pack.finaltotal ?? pack.jobTotal ?? costPack?.finaltotal ?? costPack?.jobTotal ?? 0;

    return { unitRate: toNumber(unitRate), jobTotal: toNumber(jobTotal) };
  };

  const getGroupedProcessCost = (process) => {
    const unitRate = process.unit_cost ?? process.unitRate ?? 0;
    const jobTotal = process.job_cost ?? process.jobTotal ?? 0;
    return { unitRate: toNumber(unitRate), jobTotal: toNumber(jobTotal) };
  };

  let subtotalMatUnit = 0;
  let subtotalMatJob = 0;
  let materialRows = "";

  materialSpecification.forEach((material, idx) => {
    const { unitRate, jobTotal } = getMaterialCost(material, idx);
    subtotalMatUnit += unitRate;
    subtotalMatJob += jobTotal;

    materialRows += `
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">${material.material_name || "-"}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">${material.input?.size || "-"}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">${material.alias || "-"}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">${material.color || "-"}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">${material.final_total ? `${material.final_total} ${material.input?.unit || ""}` : "-"}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">${formatCurrency(unitRate)}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">${formatCurrency(jobTotal)}</td>
    </tr>
    `;
  });

  const materialTable = `
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    <thead>
      <tr>
        <th colspan="13" style="font-size: 16px; font-weight: bold; background-color: #dbeafe; color: #1e3a8a; padding: 12px 16px; border-left: 4px solid #3b82f6; text-align: left;">1. Material Requisition</th>
      </tr>
      <tr style="background-color: #f1f5f9;">
        <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Material Name</th>
        <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Size</th>
        <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Alias / Custom</th>
        <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Color</th>
        <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Qty</th>
        <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
        <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
        <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
        <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
        <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
        <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
        <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">Unit Cost</th>
        <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">Job Cost</th>
      </tr>
    </thead>
    <tbody>
      ${materialRows || '<tr><td colspan="13" style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">No materials</td></tr>'}
      <tr style="font-weight: bold; background-color: #f8fafc;">
        <td colspan="11" style="border: 1px solid #cbd5e1; padding: 8px;">Subtotal - Material Requisition</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">${formatCurrency(subtotalMatUnit)}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">${formatCurrency(subtotalMatJob)}</td>
      </tr>
    </tbody>
  </table>
  `;

  let subtotalProcUnit = 0;
  let subtotalProcJob = 0;
  let processTablesHtml = `
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
    <tr>
      <td colspan="13" style="font-size: 16px; font-weight: bold; background-color: #dbeafe; color: #1e3a8a; padding: 12px 16px; border-left: 4px solid #3b82f6; text-align: left;">2. Process Workflow</td>
    </tr>
  </table>
  `;

  materialProcess.forEach((materialGroup, gIdx) => {
    let groupRows = "";
    materialGroup.processes?.forEach((process, pIdx) => {
      const { unitRate, jobTotal } = getProcessCost(process, gIdx, pIdx);
      subtotalProcUnit += unitRate;
      subtotalProcJob += jobTotal;

      groupRows += `
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${process.process_index || `${gIdx + 1}.${pIdx + 1}`}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${process.process_name || "-"}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${process.input?.actual_input || "-"}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">${formatCurrency(unitRate)}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">${formatCurrency(jobTotal)}</td>
      </tr>
      `;
    });

    processTablesHtml += `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
      <thead>
        <tr style="background-color: #f8fafc;">
          <th colspan="13" style="border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 14px; font-weight: bold; color: #475569;">Section: ${materialGroup.material_group_name || `Group ${gIdx + 1}`}</th>
        </tr>
        <tr style="background-color: #f1f5f9;">
          <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">#</th>
          <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Process Name</th>
          <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Input</th>
          <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
          <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
          <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
          <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
          <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
          <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
          <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
          <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
          <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">Unit Cost</th>
          <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">Job Cost</th>
        </tr>
      </thead>
      <tbody>
        ${groupRows || '<tr><td colspan="13" style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">No processes</td></tr>'}
      </tbody>
    </table>
    `;
  });

  processTablesHtml += `
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    <tbody>
      <tr style="font-weight: bold; background-color: #f8fafc;">
        <td colspan="11" style="border: 1px solid #cbd5e1; padding: 8px;">Subtotal - Process Workflow</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">${formatCurrency(subtotalProcUnit)}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">${formatCurrency(subtotalProcJob)}</td>
      </tr>
    </tbody>
  </table>
  `;

  let subtotalPackUnit = 0;
  let subtotalPackJob = 0;
  let packingRows = "";

  packingData.forEach((item, idx) => {
    const { unitRate, jobTotal } = getPackingCost(item, idx);
    subtotalPackUnit += unitRate;
    subtotalPackJob += jobTotal;

    packingRows += `
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">${item.name || "-"}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">${item.qty || "-"}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">${formatCurrency(unitRate)}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">${formatCurrency(jobTotal)}</td>
    </tr>
    `;
  });

  const packingTable = `
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    <thead>
      <tr>
        <th colspan="13" style="font-size: 16px; font-weight: bold; background-color: #dbeafe; color: #1e3a8a; padding: 12px 16px; border-left: 4px solid #3b82f6; text-align: left;">3. Packing Instructions</th>
      </tr>
      <tr style="background-color: #f1f5f9;">
        <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Item</th>
        <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Spec / Qty</th>
        <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
        <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
        <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
        <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
        <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
        <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
        <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
        <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
        <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
        <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">Unit Cost</th>
        <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">Job Cost</th>
      </tr>
    </thead>
    <tbody>
      ${packingRows || '<tr><td colspan="13" style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">No packing details</td></tr>'}
      <tr style="font-weight: bold; background-color: #f8fafc;">
        <td colspan="11" style="border: 1px solid #cbd5e1; padding: 8px;">Subtotal - Packing Instructions</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">${formatCurrency(subtotalPackUnit)}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">${formatCurrency(subtotalPackJob)}</td>
      </tr>
    </tbody>
  </table>
  `;

  let deptTablesHtml = `
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
    <tr>
      <td colspan="13" style="font-size: 18px; font-weight: bold; background-color: #fef3c7; color: #92400e; padding: 12px 16px; border-left: 4px solid #f59e0b; text-align: left;">Department-wise Process Job Sheet</td>
    </tr>
  </table>
  `;

  Object.entries(groupedProcesses).forEach(([department, processes]) => {
    let deptRows = "";
    let deptSubtotalUnit = 0;
    let deptSubtotalJob = 0;

    processes.forEach((process, idx) => {
      const { unitRate, jobTotal } = getGroupedProcessCost(process);
      deptSubtotalUnit += unitRate;
      deptSubtotalJob += jobTotal;

      deptRows += `
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${process.process_index || idx + 1}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${process.process_name || "-"}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">
          ${process.material_input?.size || process.input?.baselength ?
            `${process.input?.baselength || ""} x ${process.input?.basewidth || ""}` : "-"}
        </td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${process.order_qty || bomData.job_quantity || 1}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${process.outsource > 0 ? "Outsource" : "Inhouse"}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${process.vendor || "-"}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${process.material_group_name || "-"}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${process.material_input?.size || "-"}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${process.material_total ? `${process.material_total} ${process.material_unit || ""}` : "-"}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${process.material_input?.ups || "-"}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${process.input?.actual_input || "-"}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">${formatCurrency(unitRate)}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">${formatCurrency(jobTotal)}</td>
      </tr>
      `;
    });

    deptTablesHtml += `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #f8fafc;">
          <th colspan="13" style="border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 15px; font-weight: bold; color: #1f2937;">Department: ${department}</th>
        </tr>
        <tr style="background-color: #f1f5f9; font-size: 11px;">
          <th style="border: 1px solid #cbd5e1; padding: 6px;">Sr No</th>
          <th style="border: 1px solid #cbd5e1; padding: 6px;">Process Name</th>
          <th style="border: 1px solid #cbd5e1; padding: 6px;">Alias</th>
          <th style="border: 1px solid #cbd5e1; padding: 6px;">Job Qty</th>
          <th style="border: 1px solid #cbd5e1; padding: 6px;">Inhouse/Outsource</th>
          <th style="border: 1px solid #cbd5e1; padding: 6px;">Vendor</th>
          <th style="border: 1px solid #cbd5e1; padding: 6px;">Material Type</th>
          <th style="border: 1px solid #cbd5e1; padding: 6px;">Size</th>
          <th style="border: 1px solid #cbd5e1; padding: 6px;">Qty</th>
          <th style="border: 1px solid #cbd5e1; padding: 6px;">UPS</th>
          <th style="border: 1px solid #cbd5e1; padding: 6px;">Input</th>
          <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: right;">Unit Cost</th>
          <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: right;">Job Cost</th>
        </tr>
      </thead>
      <tbody>
        ${deptRows}
        <tr style="font-weight: bold; background-color: #f8fafc;">
          <td colspan="11" style="border: 1px solid #cbd5e1; padding: 8px;">Subtotal - ${department}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">${formatCurrency(deptSubtotalUnit)}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">${formatCurrency(deptSubtotalJob)}</td>
        </tr>
      </tbody>
    </table>
    `;
  });

  const grandTotalUnit = subtotalMatUnit + subtotalProcUnit + subtotalPackUnit;
  const grandTotalJob = subtotalMatJob + subtotalProcJob + subtotalPackJob;

  const grandSummaryHtml = `
  <table style="width: 100%; border-collapse: collapse; margin-top: 32px; margin-bottom: 24px;">
    <thead>
      <tr style="background-color: #0f172a; color: #ffffff;">
        <th colspan="13" style="border: 1px solid #475569; padding: 12px; font-size: 16px; font-weight: bold; text-align: center;">GRAND TOTAL SUMMARY</th>
      </tr>
    </thead>
    <tbody>
      <tr style="font-weight: bold; background-color: #f1f5f9;">
        <td colspan="11" style="border: 1px solid #cbd5e1; padding: 12px; text-align: right;">TOTALS</td>
        <td style="border: 1px solid #cbd5e1; padding: 12px; text-align: center; font-weight: bold; color: #0f172a;">TOTAL UNIT COST</td>
        <td style="border: 1px solid #cbd5e1; padding: 12px; text-align: center; font-weight: bold; color: #0f172a;">TOTAL JOB COST</td>
      </tr>
      <tr style="font-weight: bold; font-size: 16px; color: #4f46e5; background-color: #f8fafc;">
        <td colspan="11" style="border: 1px solid #cbd5e1; padding: 16px; text-align: right;">Grand Total</td>
        <td style="border: 1px solid #cbd5e1; padding: 16px; text-align: right;">${formatCurrency(grandTotalUnit)}</td>
        <td style="border: 1px solid #cbd5e1; padding: 16px; text-align: right;">${formatCurrency(grandTotalJob)}</td>
      </tr>
    </tbody>
  </table>
  `;

  const titleHeader = `
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    <tr>
      <td colspan="13" style="font-size: 24px; font-weight: bold; text-align: center; color: #0f172a; padding: 12px 0;">PRODUCTION COST SHEET</td>
    </tr>
    <tr style="font-size: 14px;">
      <td colspan="6" style="padding: 6px 0;"><span style="font-weight: bold; color: #475569;">Product Name:</span> <span style="color: #2563eb; font-weight: bold;">${bomData.product_name || "-"}</span></td>
      <td colspan="7" style="padding: 6px 0; text-align: right;"><span style="font-weight: bold; color: #475569;">Total Qty:</span> <span style="color: #2563eb; font-weight: bold;">${bomData.job_quantity || 1}</span></td>
    </tr>
    <tr style="font-size: 14px;">
      <td colspan="6" style="padding: 6px 0;"><span style="font-weight: bold; color: #475569;">Job No:</span> <span style="color: #0f172a; font-weight: bold;">${bomData.job_no || "-"}</span></td>
      <td colspan="7" style="padding: 6px 0; text-align: right;"><span style="font-weight: bold; color: #475569;">Sub Job No:</span> <span style="color: #0f172a; font-weight: bold;">${bomData.sub_job_no || "-"}</span></td>
    </tr>
  </table>
  `;

  const finalHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Cost Sheet</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px;">
      ${titleHeader}
      ${materialTable}
      ${processTablesHtml}
      ${packingTable}
      ${grandSummaryHtml}
      ${deptTablesHtml}
    </body>
    </html>
  `;

  const blob = new Blob([finalHtml], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `Cost_Sheet_${bomData.job_no || "Job"}_${bomData.sub_job_no || "Sub"}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadJobSheetExcel = (bomData) => {
  if (!bomData) return;
  const materialSpecification = bomData.material_specification || [];
  const materialProcess = bomData.materialprocess || [];
  const packingData = bomData.packingdatas || [];
  const groupedProcesses = groupProcessesByDepartment(bomData);

  let materialRows = "";
  materialSpecification.forEach((material) => {
    materialRows += `
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">${material.material_name || "-"}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">${material.input?.size || "-"}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">${material.alias || "-"}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">${material.color || "-"}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">${material.final_total ? `${material.final_total} ${material.input?.unit || ""}` : "-"}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
    </tr>
    `;
  });

  const materialTable = `
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    <thead>
      <tr>
        <th colspan="11" style="font-size: 16px; font-weight: bold; background-color: #dbeafe; color: #1e3a8a; padding: 12px 16px; border-left: 4px solid #3b82f6; text-align: left;">1. Material Requisition</th>
      </tr>
      <tr style="background-color: #f1f5f9;">
        <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Material Name</th>
        <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Size</th>
        <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Alias / Custom</th>
        <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Color</th>
        <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Qty</th>
        <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
        <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
        <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
        <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
        <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
        <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
      </tr>
    </thead>
    <tbody>
      ${materialRows || '<tr><td colspan="11" style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">No materials</td></tr>'}
    </tbody>
  </table>
  `;

  let processTablesHtml = `
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
    <tr>
      <td colspan="11" style="font-size: 16px; font-weight: bold; background-color: #dbeafe; color: #1e3a8a; padding: 12px 16px; border-left: 4px solid #3b82f6; text-align: left;">2. Process Workflow</td>
    </tr>
  </table>
  `;

  materialProcess.forEach((materialGroup, gIdx) => {
    let groupRows = "";
    materialGroup.processes?.forEach((process, pIdx) => {
      groupRows += `
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${process.process_index || `${gIdx + 1}.${pIdx + 1}`}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${process.process_name || "-"}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${process.input?.actual_input || "-"}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
      </tr>
      `;
    });

    processTablesHtml += `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
      <thead>
        <tr style="background-color: #f8fafc;">
          <th colspan="11" style="border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 14px; font-weight: bold; color: #475569;">Section: ${materialGroup.material_group_name || `Group ${gIdx + 1}`}</th>
        </tr>
        <tr style="background-color: #f1f5f9;">
          <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">#</th>
          <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Process Name</th>
          <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Input</th>
          <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
          <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
          <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
          <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
          <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
          <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
          <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
          <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
        </tr>
      </thead>
      <tbody>
        ${groupRows || '<tr><td colspan="11" style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">No processes</td></tr>'}
      </tbody>
    </table>
    `;
  });

  let packingRows = "";
  packingData.forEach((item) => {
    packingRows += `
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">${item.name || "-"}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">${item.qty || "-"}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
    </tr>
    `;
  });

  const packingTable = `
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    <thead>
      <tr>
        <th colspan="11" style="font-size: 16px; font-weight: bold; background-color: #dbeafe; color: #1e3a8a; padding: 12px 16px; border-left: 4px solid #3b82f6; text-align: left;">3. Packing Instructions</th>
      </tr>
      <tr style="background-color: #f1f5f9;">
        <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Item</th>
        <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Spec / Qty</th>
        <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
        <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
        <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
        <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
        <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
        <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
        <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
        <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
        <th style="border: 1px solid #cbd5e1; padding: 8px;"></th>
      </tr>
    </thead>
    <tbody>
      ${packingRows || '<tr><td colspan="11" style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">No packing details</td></tr>'}
    </tbody>
  </table>
  `;

  let deptTablesHtml = `
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
    <tr>
      <td colspan="11" style="font-size: 18px; font-weight: bold; background-color: #fef3c7; color: #92400e; padding: 12px 16px; border-left: 4px solid #f59e0b; text-align: left;">Department-wise Process Job Sheet</td>
    </tr>
  </table>
  `;

  Object.entries(groupedProcesses).forEach(([department, processes]) => {
    let deptRows = "";

    processes.forEach((process, idx) => {
      deptRows += `
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${process.process_index || idx + 1}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${process.process_name || "-"}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">
          ${process.material_input?.size || process.input?.baselength ?
            `${process.input?.baselength || ""} x ${process.input?.basewidth || ""}` : "-"}
        </td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${process.order_qty || bomData.job_quantity || 1}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${process.outsource > 0 ? "Outsource" : "Inhouse"}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${process.vendor || "-"}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${process.material_group_name || "-"}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${process.material_input?.size || "-"}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${process.material_total ? `${process.material_total} ${process.material_unit || ""}` : "-"}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${process.material_input?.ups || "-"}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${process.input?.actual_input || "-"}</td>
      </tr>
      `;
    });

    deptTablesHtml += `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #f8fafc;">
          <th colspan="11" style="border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 15px; font-weight: bold; color: #1f2937;">Department: ${department}</th>
        </tr>
        <tr style="background-color: #f1f5f9; font-size: 11px;">
          <th style="border: 1px solid #cbd5e1; padding: 6px;">Sr No</th>
          <th style="border: 1px solid #cbd5e1; padding: 6px;">Process Name</th>
          <th style="border: 1px solid #cbd5e1; padding: 6px;">Alias</th>
          <th style="border: 1px solid #cbd5e1; padding: 6px;">Job Qty</th>
          <th style="border: 1px solid #cbd5e1; padding: 6px;">Inhouse/Outsource</th>
          <th style="border: 1px solid #cbd5e1; padding: 6px;">Vendor</th>
          <th style="border: 1px solid #cbd5e1; padding: 6px;">Material Type</th>
          <th style="border: 1px solid #cbd5e1; padding: 6px;">Size</th>
          <th style="border: 1px solid #cbd5e1; padding: 6px;">Qty</th>
          <th style="border: 1px solid #cbd5e1; padding: 6px;">UPS</th>
          <th style="border: 1px solid #cbd5e1; padding: 6px;">Input</th>
        </tr>
      </thead>
      <tbody>
        ${deptRows}
      </tbody>
    </table>
    `;
  });

  const titleHeader = `
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    <tr>
      <td colspan="11" style="font-size: 24px; font-weight: bold; text-align: center; color: #0f172a; padding: 12px 0;">PRODUCTION JOB SHEET</td>
    </tr>
    <tr style="font-size: 14px;">
      <td colspan="5" style="padding: 6px 0;"><span style="font-weight: bold; color: #475569;">Product Name:</span> <span style="color: #2563eb; font-weight: bold;">${bomData.product_name || "-"}</span></td>
      <td colspan="6" style="padding: 6px 0; text-align: right;"><span style="font-weight: bold; color: #475569;">Total Qty:</span> <span style="color: #2563eb; font-weight: bold;">${bomData.job_quantity || 1}</span></td>
    </tr>
    <tr style="font-size: 14px;">
      <td colspan="5" style="padding: 6px 0;"><span style="font-weight: bold; color: #475569;">Job No:</span> <span style="color: #0f172a; font-weight: bold;">${bomData.job_no || "-"}</span></td>
      <td colspan="6" style="padding: 6px 0; text-align: right;"><span style="font-weight: bold; color: #475569;">Sub Job No:</span> <span style="color: #0f172a; font-weight: bold;">${bomData.sub_job_no || "-"}</span></td>
    </tr>
  </table>
  `;

  const finalHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Job Sheet</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px;">
      ${titleHeader}
      ${materialTable}
      ${processTablesHtml}
      ${packingTable}
      ${deptTablesHtml}
    </body>
    </html>
  `;

  const blob = new Blob([finalHtml], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `Job_Sheet_${bomData.job_no || "Job"}_${bomData.sub_job_no || "Sub"}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
