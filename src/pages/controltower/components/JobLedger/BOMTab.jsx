import React, { useState, useEffect } from 'react';
import { axiosInstance } from "../../../../utils/url/config";
import { groupProcessesByDepartment } from "../../../../utils/helper/excelExportHelper";

const tableHeaderStyle = {
    padding: "10px 12px",
    textAlign: "left",
    fontSize: "12px",
    fontWeight: 600,
    color: "#475569",
    borderBottom: "1px solid #e5e7eb",
    borderRight: "1px solid #e5e7eb",
};

const tableCellStyle = {
    padding: "10px 12px",
    fontSize: "13px",
    color: "#1f2937",
    borderBottom: "1px solid #e5e7eb",
    borderRight: "1px solid #e5e7eb",
};

const formatCurrency = (val) => {
    const num = Number(val);
    return isNaN(num) ? "₹0.00" : `₹${num.toFixed(2)}`;
};

const toNumber = (val) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
};

function BOMTab({ job }) {
    const [bomData, setBomData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!job || !job.id) return;

        setLoading(true);
        // Search BOM by job.id (which acts as job_no or sub_job_no)
        axiosInstance.get(`/bom?search=${job.id}`)
            .then(res => {
                const boms = res.data?.data || [];
                // Find exact match
                const exactMatch = boms.find(b => b.sub_job_no === job.id || b.job_no === job.id);
                setBomData(exactMatch || boms[0] || null);
            })
            .catch(err => {
                console.error("Error fetching BOM:", err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [job]);

    if (!job) return null;

    if (loading) {
        return <div style={{ padding: "40px", textAlign: "center", color: "#64748b", fontWeight: 600 }}>Loading Cost Sheet Data...</div>;
    }

    const source = bomData || job;

    const materialSpecification = source.material_specification || source.bomMaterial || [];
    const materialProcess = source.materialprocess || (source.bomProcess ? [{ material_group_name: "General", processes: source.bomProcess }] : []);
    const packingData = source.packingdatas || source.packing?.destinations || [];
    const groupedProcesses = groupProcessesByDepartment(source);

    // Cost calculations
    const getMaterialCost = (material, idx) => {
        const costItem = source.costdetails?.materialSpecification?.[idx] ||
            source.costdetails?.materialSpecification?.find(m => m.item_id === material.item_id);

        let unitRate = material.unitRate ?? material.unit_rate ?? costItem?.unitRate ?? costItem?.unit_rate;
        let jobTotal = material.jobTotal ?? material.job_total ?? costItem?.jobTotal ?? costItem?.job_total;

        if (unitRate === undefined || jobTotal === undefined) {
            const rate = toNumber(material.rate || costItem?.rate || 0);
            const final_total = toNumber(material.final_total || costItem?.final_total || material.bomQty || 0);
            if (material.material_type === "sheet" && material.input?.size) {
                const [w, h] = material.input.size.split("x").map(toNumber);
                const mult = w * h > 0 ? w * h : 1;
                jobTotal = rate * mult * final_total;
            } else {
                jobTotal = rate * final_total;
            }
            unitRate = jobTotal / toNumber(job.qty || job.job_quantity || 1);
        }


        // Fallback for mocked data
        if (material.bomCost !== undefined) {
            jobTotal = material.bomCost;
            unitRate = material.rate || (material.bomCost / (material.bomQty || 1));
        }

        return { unitRate: toNumber(unitRate), jobTotal: toNumber(jobTotal) };
    };

    const getProcessCost = (process, groupIdx, procIdx) => {
        const costGroup = source.costdetails?.materialprocess?.[groupIdx];
        const costProc = costGroup?.processes?.[procIdx] ||
            costGroup?.processes?.find(p => p.process_name === process.process_name);

        let unitRate = process.unit_cost ?? process.unitRate ?? costProc?.unit_cost ?? costProc?.unitRate ?? toNumber(process.rate || costProc?.rate || 0);
        let jobTotal = process.job_cost ?? process.jobTotal ?? costProc?.job_cost ?? costProc?.jobTotal ?? 0;

        // Fallback for mocked data
        if (process.bomCost !== undefined) {
            jobTotal = process.bomCost;
            unitRate = process.rate || (process.bomCost / (process.bomQty || 1));
        }

        return { unitRate: toNumber(unitRate), jobTotal: toNumber(jobTotal) };
    };

    const getPackingCost = (pack, idx) => {
        const costPack = source.costdetails?.packingdatas?.[idx] ||
            source.costdetails?.packingdatas?.find(p => p.name === pack.name);

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
    let subtotalProcUnit = 0;
    let subtotalProcJob = 0;
    let subtotalPackUnit = 0;
    let subtotalPackJob = 0;

    return (
        <div style={{ backgroundColor: "#fff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>

            <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", margin: "0 0 12px 0" }}>PRODUCTION COST SHEET</h2>
                <div style={{ display: "flex", justifyContent: "center", gap: "32px", fontSize: "14px", color: "#64748b" }}>
                    <div><span style={{ fontWeight: 600 }}>Product Name:</span> <span style={{ color: "#2563eb", fontWeight: 600 }}>{job.product || job.product_name || "-"}</span></div>
                    <div><span style={{ fontWeight: 600 }}>Total Qty:</span> <span style={{ color: "#2563eb", fontWeight: 700 }}>{job.qty || job.job_quantity || 1}</span></div>
                </div>
            </div>

            {/* 1. Material Requisition */}
            <div style={{ marginBottom: "32px" }}>
                <div
                    style={{
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "#1e3a8a",
                        padding: "12px 16px",
                        backgroundColor: "#dbeafe",
                        borderLeft: "4px solid #3b82f6",
                        marginBottom: "12px",
                    }}
                >
                    1. Material Requisition
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e5e7eb" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#f1f5f9" }}>
                            <th style={tableHeaderStyle}>Material Name</th>
                            <th style={tableHeaderStyle}>Size</th>
                            <th style={tableHeaderStyle}>Alias / Custom</th>
                            <th style={tableHeaderStyle}>Color</th>
                            <th style={tableHeaderStyle}>Qty</th>
                            <th style={{ ...tableHeaderStyle, textAlign: "right" }}>Unit Cost</th>
                            <th style={{ ...tableHeaderStyle, textAlign: "right" }}>Job Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        {materialSpecification.map((material, idx) => {
                            const { unitRate, jobTotal } = getMaterialCost(material, idx);
                            subtotalMatUnit += unitRate;
                            subtotalMatJob += jobTotal;

                            return (
                                <tr key={idx}>
                                    <td style={tableCellStyle}>{material.material_name || material.item || "-"}</td>
                                    <td style={tableCellStyle}>{material.input?.size || material.spec || "-"}</td>
                                    <td style={tableCellStyle}>{material.alias || "-"}</td>
                                    <td style={tableCellStyle}>{material.color || "-"}</td>
                                    <td style={tableCellStyle}>
                                        {material.final_total ? `${material.final_total} ${material.input?.unit || ""}` : (material.bomQty ? `${material.bomQty} ${material.bomQtyUnit || ""}` : "-")}
                                    </td>
                                    <td style={{ ...tableCellStyle, textAlign: "right" }}>{formatCurrency(unitRate)}</td>
                                    <td style={{ ...tableCellStyle, textAlign: "right", fontWeight: 600 }}>{formatCurrency(jobTotal)}</td>
                                </tr>
                            );
                        })}
                        {materialSpecification.length === 0 && (
                            <tr>
                                <td colSpan="7" style={{ ...tableCellStyle, textAlign: "center", color: "#94a3b8" }}>No materials</td>
                            </tr>
                        )}
                        <tr style={{ backgroundColor: "#f8fafc", fontWeight: 700 }}>
                            <td colSpan="5" style={{ ...tableCellStyle, textAlign: "right" }}>Subtotal - Material Requisition</td>
                            <td style={{ ...tableCellStyle, textAlign: "right", color: "#0f172a" }}>{formatCurrency(subtotalMatUnit)}</td>
                            <td style={{ ...tableCellStyle, textAlign: "right", color: "#0f172a" }}>{formatCurrency(subtotalMatJob)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* 2. Process Workflow */}
            <div style={{ marginBottom: "32px" }}>
                <div
                    style={{
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "#1e3a8a",
                        padding: "12px 16px",
                        backgroundColor: "#dbeafe",
                        borderLeft: "4px solid #3b82f6",
                        marginBottom: "12px",
                    }}
                >
                    2. Process Workflow
                </div>

                {materialProcess.map((materialGroup, idx) => (
                    <div key={idx} style={{ marginBottom: "20px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e5e7eb" }}>
                            <thead>
                                <tr style={{ backgroundColor: "#f8fafc" }}>
                                    <th colSpan="5" style={{ ...tableHeaderStyle, fontSize: "14px", color: "#475569" }}>
                                        Section: {materialGroup.material_group_name || `Group ${idx + 1}`}
                                    </th>
                                </tr>
                                <tr style={{ backgroundColor: "#f1f5f9" }}>
                                    <th style={tableHeaderStyle}>#</th>
                                    <th style={tableHeaderStyle}>Process Name</th>
                                    <th style={tableHeaderStyle}>Input</th>
                                    <th style={{ ...tableHeaderStyle, textAlign: "right" }}>Unit Cost</th>
                                    <th style={{ ...tableHeaderStyle, textAlign: "right" }}>Job Cost</th>
                                </tr>
                            </thead>
                            <tbody>
                                {materialGroup.processes?.map((process, pIdx) => {
                                    const { unitRate, jobTotal } = getProcessCost(process, idx, pIdx);
                                    subtotalProcUnit += unitRate;
                                    subtotalProcJob += jobTotal;

                                    return (
                                        <tr key={pIdx}>
                                            <td style={tableCellStyle}>{process.process_index || `${idx + 1}.${pIdx + 1}`}</td>
                                            <td style={tableCellStyle}>{process.process_name || process.process || "-"}</td>
                                            <td style={tableCellStyle}>{process.input?.actual_input || process.bomQty || "-"}</td>
                                            <td style={{ ...tableCellStyle, textAlign: "right" }}>{formatCurrency(unitRate)}</td>
                                            <td style={{ ...tableCellStyle, textAlign: "right", fontWeight: 600 }}>{formatCurrency(jobTotal)}</td>
                                        </tr>
                                    );
                                })}
                                {(!materialGroup.processes || materialGroup.processes.length === 0) && (
                                    <tr>
                                        <td colSpan="5" style={{ ...tableCellStyle, textAlign: "center", color: "#94a3b8" }}>No processes</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ))}

                <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e5e7eb" }}>
                    <tbody>
                        <tr style={{ backgroundColor: "#f8fafc", fontWeight: 700 }}>
                            <td style={{ ...tableCellStyle, textAlign: "right" }}>Subtotal - Process Workflow</td>
                            <td style={{ ...tableCellStyle, textAlign: "right", color: "#0f172a", width: "120px" }}>{formatCurrency(subtotalProcUnit)}</td>
                            <td style={{ ...tableCellStyle, textAlign: "right", color: "#0f172a", width: "120px" }}>{formatCurrency(subtotalProcJob)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* 3. Packing Instructions */}
            <div style={{ marginBottom: "32px" }}>
                <div
                    style={{
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "#1e3a8a",
                        padding: "12px 16px",
                        backgroundColor: "#dbeafe",
                        borderLeft: "4px solid #3b82f6",
                        marginBottom: "12px",
                    }}
                >
                    3. Packing Instructions
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e5e7eb" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#f1f5f9" }}>
                            <th style={tableHeaderStyle}>Item</th>
                            <th style={tableHeaderStyle}>Spec / Qty</th>
                            <th style={{ ...tableHeaderStyle, textAlign: "right" }}>Unit Cost</th>
                            <th style={{ ...tableHeaderStyle, textAlign: "right" }}>Job Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        {packingData.map((item, idx) => {
                            const { unitRate, jobTotal } = getPackingCost(item, idx);
                            subtotalPackUnit += unitRate;
                            subtotalPackJob += jobTotal;

                            return (
                                <tr key={idx}>
                                    <td style={tableCellStyle}>{item.name || "-"}</td>
                                    <td style={tableCellStyle}>{item.qty || "-"}</td>
                                    <td style={{ ...tableCellStyle, textAlign: "right" }}>{formatCurrency(unitRate)}</td>
                                    <td style={{ ...tableCellStyle, textAlign: "right", fontWeight: 600 }}>{formatCurrency(jobTotal)}</td>
                                </tr>
                            );
                        })}
                        {packingData.length === 0 && (
                            <tr>
                                <td colSpan="4" style={{ ...tableCellStyle, textAlign: "center", color: "#94a3b8" }}>No packing details</td>
                            </tr>
                        )}
                        <tr style={{ backgroundColor: "#f8fafc", fontWeight: 700 }}>
                            <td colSpan="2" style={{ ...tableCellStyle, textAlign: "right" }}>Subtotal - Packing Instructions</td>
                            <td style={{ ...tableCellStyle, textAlign: "right", color: "#0f172a" }}>{formatCurrency(subtotalPackUnit)}</td>
                            <td style={{ ...tableCellStyle, textAlign: "right", color: "#0f172a" }}>{formatCurrency(subtotalPackJob)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Grand Total Summary */}
            <div style={{ marginBottom: "32px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#0f172a", color: "#ffffff" }}>
                            <th colSpan="3" style={{ padding: "12px", fontSize: "16px", fontWeight: "bold", textAlign: "center", border: "1px solid #475569" }}>
                                GRAND TOTAL SUMMARY
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style={{ backgroundColor: "#f1f5f9", fontWeight: "bold" }}>
                            <td style={{ padding: "12px", textAlign: "right", border: "1px solid #cbd5e1" }}>TOTALS</td>
                            <td style={{ padding: "12px", textAlign: "center", color: "#0f172a", border: "1px solid #cbd5e1" }}>TOTAL UNIT COST</td>
                            <td style={{ padding: "12px", textAlign: "center", color: "#0f172a", border: "1px solid #cbd5e1" }}>TOTAL JOB COST</td>
                        </tr>
                        <tr style={{ backgroundColor: "#f8fafc", fontWeight: "bold", fontSize: "16px", color: "#4f46e5" }}>
                            <td style={{ padding: "16px", textAlign: "right", border: "1px solid #cbd5e1" }}>Grand Total</td>
                            <td style={{ padding: "16px", textAlign: "right", border: "1px solid #cbd5e1" }}>{formatCurrency(subtotalMatUnit + subtotalProcUnit + subtotalPackUnit)}</td>
                            <td style={{ padding: "16px", textAlign: "right", border: "1px solid #cbd5e1" }}>{formatCurrency(subtotalMatJob + subtotalProcJob + subtotalPackJob)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Department-wise Process Job Sheet */}
            {Object.keys(groupedProcesses).length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                    <div
                        style={{
                            fontSize: "18px",
                            fontWeight: 700,
                            color: "#92400e",
                            padding: "12px 16px",
                            backgroundColor: "#fef3c7",
                            borderLeft: "4px solid #f59e0b",
                            marginBottom: "16px",
                        }}
                    >
                        Department-wise Process Job Sheet
                    </div>

                    {Object.entries(groupedProcesses).map(([department, processes]) => {
                        let deptSubtotalUnit = 0;
                        let deptSubtotalJob = 0;

                        return (
                            <div key={department} style={{ marginBottom: "24px" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e5e7eb" }}>
                                    <thead>
                                        <tr style={{ backgroundColor: "#f8fafc" }}>
                                            <th colSpan="13" style={{ ...tableHeaderStyle, fontSize: "15px", color: "#1f2937" }}>
                                                Department: {department}
                                            </th>
                                        </tr>
                                        <tr style={{ backgroundColor: "#f1f5f9", fontSize: "11px" }}>
                                            <th style={tableHeaderStyle}>Sr No</th>
                                            <th style={tableHeaderStyle}>Process Name</th>
                                            <th style={tableHeaderStyle}>Alias</th>
                                            <th style={tableHeaderStyle}>Job Qty</th>
                                            <th style={tableHeaderStyle}>Inhouse / Outsource</th>
                                            <th style={tableHeaderStyle}>Vendor</th>
                                            <th style={tableHeaderStyle}>Material Type</th>
                                            <th style={tableHeaderStyle}>Size</th>
                                            <th style={tableHeaderStyle}>Qty</th>
                                            <th style={tableHeaderStyle}>UPS</th>
                                            <th style={tableHeaderStyle}>Input</th>
                                            <th style={{ ...tableHeaderStyle, textAlign: "right" }}>Unit Cost</th>
                                            <th style={{ ...tableHeaderStyle, textAlign: "right" }}>Job Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {processes.map((process, idx) => {
                                            const { unitRate, jobTotal } = getGroupedProcessCost(process);
                                            deptSubtotalUnit += unitRate;
                                            deptSubtotalJob += jobTotal;

                                            return (
                                                <tr key={idx}>
                                                    <td style={tableCellStyle}>{process.process_index || idx + 1}</td>
                                                    <td style={tableCellStyle}>{process.process_name}</td>
                                                    <td style={tableCellStyle}>
                                                        {process.material_input?.size || process.input?.baselength ?
                                                            `${process.input?.baselength || ""} x ${process.input?.basewidth || ""}` : "-"}
                                                    </td>
                                                    <td style={tableCellStyle}>{process.order_qty || job.job_quantity || "-"}</td>
                                                    <td style={tableCellStyle}>
                                                        {process.outsource > 0 ? "Outsource" : "Inhouse"}
                                                    </td>
                                                    <td style={tableCellStyle}>{process.vendor || "-"}</td>
                                                    <td style={tableCellStyle}>{process.material_group_name || "-"}</td>
                                                    <td style={tableCellStyle}>{process.material_input?.size || "-"}</td>
                                                    <td style={tableCellStyle}>
                                                        {process.material_total ? `${process.material_total} ${process.material_unit || ""}` : "-"}
                                                    </td>
                                                    <td style={tableCellStyle}>{process.material_input?.ups || "-"}</td>
                                                    <td style={tableCellStyle}>{process.input?.actual_input || "-"}</td>
                                                    <td style={{ ...tableCellStyle, textAlign: "right" }}>{formatCurrency(unitRate)}</td>
                                                    <td style={{ ...tableCellStyle, textAlign: "right", fontWeight: 600 }}>{formatCurrency(jobTotal)}</td>
                                                </tr>
                                            );
                                        })}
                                        <tr style={{ backgroundColor: "#f8fafc", fontWeight: 700 }}>
                                            <td colSpan="11" style={{ ...tableCellStyle, textAlign: "right" }}>Subtotal - {department}</td>
                                            <td style={{ ...tableCellStyle, textAlign: "right", color: "#0f172a" }}>{formatCurrency(deptSubtotalUnit)}</td>
                                            <td style={{ ...tableCellStyle, textAlign: "right", color: "#0f172a" }}>{formatCurrency(deptSubtotalJob)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default BOMTab;