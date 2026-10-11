import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllItems } from "../../../reducer/inventory/itemReducer";
import { FormControl, Select, MenuItem } from "@mui/material";
import { evaluateLogicRate } from "../../../utils/helper/logicRateEvaluator";


export default function PackingStep({ handleNext, handleBack, handleSaveDraft, formData, setFormData, isViewMode }) {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((state) => state.items);

  const [selectedItemId, setSelectedItemId] = useState("");
  const [showQtyModal, setShowQtyModal] = useState(false);
  const [qtyValue, setQtyValue] = useState("");
  const [activeIndex, setActiveIndex] = useState(null);

  const [rows, setRows] = useState(formData?.packingdatas || []);

  console.log("packing formData", formData)

  useEffect(() => {
    setRows(formData?.packingdatas || []);
  }, [formData?.packingdatas]);

  useEffect(() => {
    dispatch(
      fetchAllItems({
        sortOrder: "asc",
        type_id_name: true,
      })
    );
  }, [dispatch]);

  // Add this inside the PackingStep component
  useEffect(() => {
    if (rows.length === 0 || !formData?.jobQty) return;

    const jobQty = Number(formData.jobQty || 1);

    const updatedRows = rows.map((row) => {
      let newUnitCost = row.total;
      let newFinalTotal = row.finaltotal;

      if (row.itemType === "logic") {
        // Recalculate Logic-based items (like Thermocol or custom boxes)
        const { logic1, logic2, logic3, name, logicalRate, unitCost } = row;

        const context = {
          logic1: Number(logic1 || 0),
          logic2: Number(logic2 || 0),
          logic3: Number(logic3 || 0),
          jobQty: Number(jobQty)
        };
        console.log("logic", logicalRate)

        const dynamicRate = evaluateLogicRate(logicalRate, context);
        let currentRate = dynamicRate > 0 ? dynamicRate : unitCost;

        if (logic1 && logic2 && logic3) {
          // Special case for Thermocol (Volume based)
          if (name === "Thermocol (Custom)") {
            const v1 = Number(logic1) * 0.0254;
            const v2 = Number(logic2) * 0.0254;
            const v3 = Number(logic3) * 0.0254;
            const area = v1 * v2 * v3;

            newUnitCost = area * currentRate;
          } else if (name === "Flap magnet box") {
            // Flap magnet box formula: (l + b + h) * 4
            const multiplier = currentRate > 0 ? currentRate : 4;
            newUnitCost = (Number(logic1) + Number(logic2) + Number(logic3)) * multiplier;
          } else {
            // Standard Sum Logic
            newUnitCost = currentRate * (Number(logic1) + Number(logic2) + Number(logic3));
          }

          newFinalTotal = newUnitCost * jobQty;
        }
      } else {
        // Recalculate Standard items and Labour
        // Formula: (unitCost * row.qty) * jobQty
        newFinalTotal = (Number(row.unitCost) * Number(row.qty)) * jobQty;
        newUnitCost = newFinalTotal / jobQty;
      }

      return {
        ...row,
        total: newUnitCost,
        finaltotal: newFinalTotal,
      };
    });

    // Update state only if values differ
    if (JSON.stringify(updatedRows) !== JSON.stringify(rows)) {
      setRows(updatedRows);
    }
  }, [formData?.jobQty, rows]); // Triggered whenever Job Qty changes



  const handleSelectChange = (e) => {
    const itemId = e.target.value;
    if (!itemId) return;

    const item = items.find((i) => i._id === itemId);
    if (!item) return;

    const newRow = {
      itemId: item._id,
      name: item.name,
      itemType: item.item_type,
      unitCost: Number(item.price) || 0,
      logicalRate: item.logical_rate || [],
      qty: "",
      logic1: "",
      logic2: "",
      logic3: "",
      total: 0,
      finaltotal: 0,
    };


    setSelectedItemId("");

    if (item.item_type === "logic") {
      setRows((prev) => [...prev, newRow]);
    } else {

      setActiveIndex(null);
      setQtyValue("");
      setShowQtyModal(newRow);
    }
  };

  const confirmQty = () => {
    if (!qtyValue) return;

    const jobQty = Number(formData?.jobQty || 1);

    if (showQtyModal) {
      const newRow = { ...showQtyModal, qty: qtyValue };

      newRow.finaltotal = (newRow.unitCost * Number(qtyValue)) * jobQty;

      newRow.total = newRow.finaltotal / jobQty;

      newRow.total_qty = newRow.itemType === 'logic' ? jobQty : Number(qtyValue) * jobQty;


      setRows((prev) => [...prev, newRow]);
      setQtyValue("");
      setShowQtyModal(false);
    }
  };

  const handleLogicChange = (index, field, value) => {
    // if (!/^\d*$/.test(value)) return;

    const updated = [...rows];
    updated[index][field] = value;

    const { logic1, logic2, logic3, logicalRate, name } = updated[index];

    // 1. Evaluate Dynamic Rate from Rules
    const context = {
      logic1: Number(logic1 || 0),
      logic2: Number(logic2 || 0),
      logic3: Number(logic3 || 0),
      jobQty: Number(formData?.jobQty || 1)
    };

    // Attempt to get a dynamic rate from the rules
    const dynamicRate = evaluateLogicRate(logicalRate, context);

    // If a rule logic matched, update the unitCost
    if (dynamicRate > 0) {
      updated[index].unitCost = dynamicRate;
    }


    /* ================= THERMOCOL (CUSTOM) - VOLUME FORMULA ================= */
    // Kept specific for Volume/Area calculation formula
    if (name === "Thermocol (Custom)" && logic1 && logic2 && logic3) {
      const v1 = Number(logic1) * 0.0254;
      const v2 = Number(logic2) * 0.0254;
      const v3 = Number(logic3) * 0.0254;

      const area = v1 * v2 * v3;

      // Note: unitCost is already set by dynamicRate above if rules exist.
      // If no rules existed (dynamicRate == 0), it retains the original unitCost (from item master potential default).

      updated[index].total = area * updated[index].unitCost;
      updated[index].finaltotal = updated[index].total * (formData?.jobQty || 1);

      setRows(updated);
      return;
    }

    /* ================= FLAP MAGNET BOX - FORMULA (L+B+H)*4 ================= */
    if (name === "Flap magnet box" && logic1 && logic2 && logic3) {
      const multiplier = updated[index].unitCost > 0 ? updated[index].unitCost : 4;
      updated[index].total =
        (Number(logic1) + Number(logic2) + Number(logic3)) * multiplier;
      updated[index].finaltotal =
        updated[index].total * (formData?.jobQty || 1);

      setRows(updated);
      return;
    }


    /* ================= STANDARD LOGIC (SUM) ================= */
    if (logic1 && logic2 && logic3) {
      updated[index].total =
        updated[index].unitCost *
        (Number(logic1) + Number(logic2) + Number(logic3));

      updated[index].finaltotal =
        updated[index].total * (formData?.jobQty || 1);
    }

    setRows(updated);
  };





  const removeRow = (index) => {
    setRows(rows.filter((_, i) => i !== index));
  };



  const addPackingLabour = () => {
    const newLabourRow = {
      name: "Packing Labour",
      itemType: "normal",
      unitCost: 1,
      qty: "",
      logic1: "",
      logic2: "",
      logic3: "",
      total: 0,
      finaltotal: 0,
    };
    setShowQtyModal(newLabourRow);
  };

  const onNextClick = () => {
    const jobQty = Number(formData.jobQty || 1);
    const formattedRows = rows.map((row) => ({
      ...row,
      total: Number(Number(row.total || 0).toFixed(3)),
      finaltotal: Number(Number(row.finaltotal || 0).toFixed(2)),
      total_qty: row.itemType === 'logic' ? jobQty : Number(row.qty || 0) * jobQty
    }));

    setFormData({
      ...formData,
      packingdatas: formattedRows,
    });

    handleNext({ packingdatas: formattedRows });
  };

  const onSaveDraftClick = () => {
    const jobQty = Number(formData.jobQty || 1);
    const formattedRows = rows.map((row) => ({
      ...row,
      total: Number(Number(row.total || 0).toFixed(3)),
      finaltotal: Number(Number(row.finaltotal || 0).toFixed(2)),
      total_qty: row.total_qty
    }));

    handleSaveDraft({ packingdatas: formattedRows });
  };

  const isNextDisabled = () => {
    if (rows.length === 0) return true;
    for (const row of rows) {
      if (row.itemType === "logic") {
        if (!row.logic1 || !row.logic2 || !row.logic3) {
          return true;
        }
      } else if (!row.qty) {
        return true;
      }
    }

    return false;
  };


  const jobQty = Number(formData?.jobQty || 1);

  const packingGrandTotals = rows.reduce(
    (acc, row) => {
      const unitCost = Number(row.total || 0);
      const jobCost = Number(row.finaltotal || 0);

      acc.totalUnitCost += unitCost;
      acc.totalJobCost += jobCost;

      return acc;
    },
    { totalUnitCost: 0, totalJobCost: 0 }
  );
  const formatCurrency = (num) => `₹${Number(num || 0).toFixed(2)}`;

  return (

    <div className="space-y-4">

      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">
        Packing
      </h2>

      <div className="flex items-end gap-2">
        <FormControl className="flex-1" size="small">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Item <span className="text-red-500">*</span>
          </label>

          <Select
            value={selectedItemId}
            onChange={handleSelectChange}
            displayEmpty
            disabled={isViewMode}
          >
            <MenuItem value="">
              <span className="text-gray-500">Select Item</span>
            </MenuItem>

            {loading ? (
              <MenuItem disabled>Loading...</MenuItem>
            ) : (
              items.map((item) => (
                <MenuItem key={item._id} value={item._id}>
                  {item.name}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        <button
          type="button"
          onClick={addPackingLabour}
          disabled={isViewMode}

          className="mt-2 px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
        >
          Add Labour
        </button>
      </div>


      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full table-auto border border-gray-300 rounded-md">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="border px-2 py-1 text-left">Item</th>
                <th className="border px-2 py-1 text-left">Inputs</th>
                <th className="border px-2 py-1 text-right">Total Qty</th>
                <th className="border px-2 py-1 text-right">Unit Cost</th>
                <th className="border px-2 py-1 text-right">Total</th>
                <th className="border px-2 py-1"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>
                  <td className="border px-2 py-1">{row.name}</td>
                  <td className="border px-2 py-1">
                    {row.itemType === "logic" ? (
                      <>
                        <div className="flex gap-2">
                          {["logic1", "logic2", "logic3"].map((f) => (
                            <input
                              key={f}
                              type="number"
                              min="0"
                              value={row[f]}
                              disabled={isViewMode}

                              placeholder="Inch"
                              onChange={(e) =>
                                handleLogicChange(idx, f, e.target.value)
                              }
                              className="w-16 px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-violet-400"
                            />
                          ))}
                        </div>
                      </>
                    ) : (
                      <span>{row.qty}</span>
                    )}
                  </td>
                  <td className="border px-2 py-1 text-right font-medium">
                    {row.itemType === 'logic' ? jobQty : (Number(row.qty || 0) * jobQty).toLocaleString()}
                  </td>
                  <td className="border px-2 py-1 text-right">
                    ₹{Number(row.total || 0).toFixed(3)}
                  </td>
                  <td className="border px-2 py-1 text-right font-semibold">
                    ₹{Number(row.finaltotal || 0).toFixed(2)}
                  </td>
                  <td className="border px-2 py-1 text-center">
                    <button
                      onClick={() => removeRow(idx)}
                      disabled={isViewMode}

                      className="text-red-500 text-xs hover:underline cursor-pointer"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}



      {/* ✅ TOTAL COST CENTER BOX */}
      <div className="flex justify-center w-full mt-9">
        <div className="rounded-xl shadow-lg px-16 py-10 max-w-3xl w-full bg-black">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-8 text-white">

            {/* Total Unit Cost */}
            <div className="flex flex-col items-center flex-1 pr-0 sm:pr-8 sm:border-r border-gray-700">
              <div className="text-sm font-medium text-gray-300 mb-2">
                Total Unit Cost
              </div>
              <div className="text-3xl font-extrabold text-white">
                {formatCurrency(packingGrandTotals.totalUnitCost)}
              </div>
            </div>

            {/* Total Job Cost */}
            <div className="flex flex-col items-center flex-1 pl-0 sm:pl-8">
              <div className="text-sm font-medium text-gray-300 mb-2">
                Total Job Cost
              </div>
              <div className="text-3xl font-extrabold text-white">
                {formatCurrency(packingGrandTotals.totalJobCost)}
              </div>
            </div>


          </div>
        </div>
      </div>




      <div className="flex justify-between mt-6">
        <button onClick={handleBack} className="px-4 py-2 rounded-md bg-orange-500 text-white border border-orange-600 hover:bg-orange-600">
          Back
        </button>

        <div className="flex gap-2">
          <button onClick={onSaveDraftClick} className="px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-700">
            Save as Draft
          </button>
          <button onClick={onNextClick}
            disabled={isNextDisabled()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Next
          </button>
        </div>
      </div>

      {showQtyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-sm rounded-lg p-5 shadow-lg">

            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              Enter Quantity / Capacity
            </h3>

            <input
              type="number"
              min="0"
              value={qtyValue}
              onChange={(e) => setQtyValue(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-violet-400"
              placeholder="Enter value"
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowQtyModal(false)}
                className="px-4 py-1.5 text-sm border rounded-md text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmQty}
                className="px-4 py-1.5 text-sm bg-violet-600 text-white rounded-md hover:bg-violet-700"
              >
                OK
              </button>
            </div>

          </div>
        </div>
      )}


    </div>
  );
}
