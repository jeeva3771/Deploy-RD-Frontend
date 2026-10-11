import React, { useState, useEffect } from "react";
import { FormControl, Select, MenuItem } from "@mui/material";

export default function Specification({ handleNext, handleBack, handleSaveDraft, formData, setFormData, isViewMode }) {
  const [itemsSpec, setItemsSpec] = useState([]);
  const [errorMessages, setErrorMessages] = useState([]);

  const formatCurrency = (num) => `₹${Number(num || 0).toFixed(2)}`;

  useEffect(() => {


    let mergedItems = [];
    const jobQty = Number(formData.jobQty || 1); // Get latest jobQty

    // 1. Create a map of existing specification data for quick lookup
    const existingSpecMap = new Map();
    if (formData.materialSpecification?.length > 0) {
      formData.materialSpecification.forEach(item => {
        // Use item_id if available, otherwise fallback to name (for legacy/db data)
        const key = item.item_id || item.itemName || item.material_name;
        existingSpecMap.set(key, item);
      });
    }

    // 2. Iterate over customItems (The Source of Truth for Order)
    if (formData.customItems?.length > 0) {
      mergedItems = formData.customItems.map(customItem => {
        const key = customItem.item_id || customItem.itemName;
        const existingItem = existingSpecMap.get(key);

        if (existingItem) {
          // --- EXISTING ITEM: PRESERVE DATA ---
          let newFinalTotal = existingItem.final_total || existingItem.finalTotal;
          const wastage = existingItem.wastage?.value ?? (existingItem.wastage || 0);
          const wastageType = existingItem.wastage?.type ?? (existingItem.wastagetype || "");
          const quantity = existingItem.input?.quantity ?? (existingItem.quantity || "");
          const size = existingItem.input?.size ?? (existingItem.size || "");
          const ups = existingItem.input?.ups ?? (existingItem.ups || 0);

          // Recalculate Final Total (in case jobQty changed)
          if (customItem.itemType === "sheet" || customItem.type === "sheet") {
            const validUps = ups > 0 ? ups : 1;
            newFinalTotal = wastageType === "%"
              ? Math.ceil((jobQty + (jobQty * (wastage / 100))) / validUps)
              : Math.ceil((jobQty + wastage) / validUps);
          } else {
            // Direct/Unit items
            const unit = existingItem.input?.unit ?? (existingItem.unit || "");
            const validQty = Number(quantity) || 0;

            if (wastageType === "%" && unit === "Unit") {
              newFinalTotal = Math.ceil((jobQty * validQty) * (1 + (wastage / 100)));
            } else if (wastageType === "%" && unit === "Job") {
              newFinalTotal = Math.ceil(validQty * (1 + (wastage / 100)));
            } else if (wastageType === "count" && unit === "Unit") {
              newFinalTotal = Math.ceil((jobQty * validQty) + wastage);
            } else {
              newFinalTotal = Math.ceil(validQty + wastage);
            }
          }

          return {
            ...customItem, // Keep latest master data
            _id: existingItem._id || existingItem.material_id,
            item_id: customItem.item_id,
            size: size,
            ups: ups,
            one_up_length: existingItem.input?.one_up_length ?? (existingItem.one_up_length || 0),
            one_up_width: existingItem.input?.one_up_width ?? (existingItem.one_up_width || 0),
            quantity: quantity,
            unit: existingItem.input?.unit ?? (existingItem.unit || ""),
            wastage: wastage,
            wastagetype: wastageType,
            finalTotal: newFinalTotal,
            vendorName: customItem.vendorName || existingItem.vendorName || "",
          };

        } else {
          // --- NEW ITEM: DEFAULT VALUES ---
          return {
            ...customItem,
            _id: null,
            quantity: "",
            size: "",
            ups: 0,
            one_up_length: 0,
            one_up_width: 0,
            wastage: 2,
            wastagetype: "%",
            finalTotal: 0,
            unit: ""
          };
        }
      });
    }

    setItemsSpec(mergedItems);


  }, [formData.customItems, formData.materialSpecification, formData.jobQty]);


  const handleChange = (index, field, value) => {
    const updated = [...itemsSpec];
    updated[index][field] = value;

    const jobQty = parseFloat(formData.jobQty) || 1;
    if (updated[index].itemType === "sheet") {
      const qty = parseFloat(updated[index].size || 0);
      const ups = parseFloat(updated[index].ups || 1);
      const wastage = parseFloat(updated[index].wastage || 0);
      if (updated[index].wastagetype === "%") {
        updated[index].finalTotal = Math.ceil((jobQty + (jobQty * (wastage / 100))) / ups);
      } else {
        updated[index].finalTotal = Math.ceil((jobQty + wastage) / ups);
      }
    } else {
      const qty = parseFloat(updated[index].quantity || 0);
      const wastage = parseFloat(updated[index].wastage || 0);
      if (updated[index].wastagetype === "%" && updated[index].unit === "Unit") {
        updated[index].finalTotal = Math.ceil((jobQty * qty) * (1 + (wastage / 100)));
      } else if (updated[index].wastagetype === "%" && updated[index].unit === "Job") {
        updated[index].finalTotal = Math.ceil(qty * (1 + (wastage / 100)));
      } else if (updated[index].wastagetype === "count" && updated[index].unit === "Unit") {
        updated[index].finalTotal = Math.ceil((jobQty * qty) + wastage);
      } else {
        updated[index].finalTotal = Math.ceil(qty + wastage);
      }

    }

    setItemsSpec(updated);
  };

  const onNextClick = () => {
    setErrorMessages([]);

    const newErrorMessages = [];

    const isValid = itemsSpec.every((item, idx) => {
      const errors = [];

      if (item.itemType === "sheet") {
        if (!item.size) errors.push("Size is required");
        if (item.ups <= 0) errors.push("Ups must be greater than 0");
        if (item.one_up_length <= 0) errors.push("one up length must be greater than 0");
        if (item.one_up_width <= 0) errors.push("one up width must be greater than 0");
      } else {
        if (!item.quantity || item.quantity <= 0)
          errors.push("Quantity must be greater than 0");
        if (!item.unit) errors.push("Unit/Job required");
      }

      if (item.wastage < 0) errors.push("Wastage cannot be negative");
      if (!item.wastagetype) errors.push("Wastage type required");

      if (errors.length) {
        newErrorMessages.push({ index: idx, errors });
      }

      return errors.length === 0;
    });

    if (!isValid) {
      setErrorMessages(newErrorMessages);
      return;
    }

    /** 🔥 FINAL STRUCTURED JSON 🔥 */
    const specificationPayload = itemsSpec.map(item => ({
      material_id: item.material_id || null,
      item_id: item.item_id || null,
      material_name: item.itemName,
      material_type: item.itemType,
      alias: item.alias || "",
      color: item.color || "",
      vendorName: item.vendorName || "",

      input:
        item.itemType === "sheet"
          ? {
            size: item.size,
            ups: Number(item.ups),
            one_up_length: Number(item.one_up_length),
            one_up_width: Number(item.one_up_width)
          }
          : {
            quantity: Number(item.quantity),
            unit: item.unit
          },

      wastage: {
        value: Number(item.wastage),
        type: item.wastagetype
      },
      category_type: item.category_type,
      final_total: Number(item.finalTotal),
      rate: item.rate || 0,
      jobTotal: item.jobTotal,
      unitRate: item.unitRate,
      is_inventory_item: item.is_inventory_item,
    }));

    /** ✅ Save to main form */
    setFormData({
      ...formData,
      materialSpecification: specificationPayload
    });

    handleNext({
      materialSpecification: specificationPayload
    });
  };

  const onSaveDraftClick = () => {
    const specificationPayload = itemsSpec.map(item => ({
      material_id: item.material_id || null,
      item_id: item.item_id || null,
      material_name: item.itemName,
      material_type: item.itemType,
      alias: item.alias || "",
      color: item.color || "",
      vendorName: item.vendorName || "",
      input: item.itemType === "sheet"
        ? {
          size: item.size,
          ups: Number(item.ups),
          one_up_length: Number(item.one_up_length),
          one_up_width: Number(item.one_up_width)
        }
        : {
          quantity: Number(item.quantity),
          unit: item.unit
        },
      wastage: {
        value: Number(item.wastage),
        type: item.wastagetype
      },
      category_type: item.category_type,
      final_total: Number(item.finalTotal),
      rate: item.rate || 0,
      is_inventory_item: item.is_inventory_item,
    }));

    handleSaveDraft({
      materialSpecification: specificationPayload
    });
  };

  const jobQty = Number(formData.jobQty || 1);

  const grandTotals = itemsSpec.reduce(
    (acc, item) => {
      let jobTotal = 0;

      if (item.itemType === "sheet" && item.size) {
        const [l, w] = item.size.split("x").map(v => Number(v.trim()));
        const area = (l || 1) * (w || 1);
        jobTotal = item.rate * area * item.finalTotal;
      } else {
        jobTotal = item.rate * item.finalTotal;
      }

      acc.totalJobCost += jobTotal;
      acc.totalUnitCost += jobTotal / jobQty;

      return acc;
    },
    { totalUnitCost: 0, totalJobCost: 0 }
  );

  const handleRefresh = () => {
    const refreshedItem = itemsSpec.map(item => ({
      ...item,
      size: item.input?.size || "",
      ups: item.input?.ups || 0,
      one_up_length: item.input?.one_up_length || 0,
      one_up_width: item.input?.one_up_width || 0,
      quantity: item.input?.quantity || "",
      unit: item.input?.unit || "",
    }));
    setItemsSpec(refreshedItem)
  }


  return (
    <div>
      <div className="flex justify-between text-sm sm:text-base">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">
          Specification
        </h2>
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
      <div className="w-full overflow-x-auto">
        <table className="min-w-[900px] w-full table-auto">
          {/* <table className="w-full table-auto"> */}
          <thead>
            <tr>
              <th className="border px-2 py-1">Material</th>
              <th className="border px-2 py-1">Input</th>
              <th className="border px-2 py-1">Wastage</th>
              <th className="border px-2 py-1">Final Total</th>
              <th className="border px-2 py-1 text-right">Unit Cost</th>
              <th className="border px-2 py-1 text-right">Job Cost</th>
            </tr>
          </thead>
          <tbody>
            {itemsSpec.map((item, idx) => {
              // 🔥 CORRECT: calculations outside JSX
              let jobTotal = 0;
              let unitRate = 0;
              const jobQty = Number(formData.jobQty || 1);

              if (item.itemType === "sheet" && item.size) {
                const [l, w] = item.size
                  .split("x")
                  .map(v => Number(v.trim()));

                const area = (l || 1) * (w || 1);

                jobTotal = item.rate * area * item.finalTotal;
                unitRate = jobTotal / jobQty;
              } else {
                jobTotal = item.rate * item.finalTotal;
                unitRate = jobTotal / jobQty;
              }

              return (
                <tr key={idx}>
                  <td className="border px-2 py-1">
                    <div>{item.itemName}</div>

                    {(item.alias || item.color) && (
                      <div className="text-xs text-gray-500 mt-1">
                        {item.alias && (
                          <span className="text-blue-600">{item.alias}</span>
                        )}

                        {(item.length || item.width || item.height) && (
                          <span className="mx-1">
                            Size :
                            {item.length && <span> {item.length}</span>}
                            {item.length && (item.width || item.height) && <span> *</span>}
                            {item.width && <span> {item.width}</span>}
                            {item.width && item.height && <span> *</span>}
                            {item.height && <span> {item.height}</span>}
                          </span>
                        )}

                        {(item.alias ||
                          item.color ||
                          item.length ||
                          item.width ||
                          item.height) && <span className="mx-1">•</span>}

                        {item.color && <span>{item.color}</span>}
                      </div>
                    )}
                  </td>

                  <td className="border px-2 py-1">
                    {item.itemType === "sheet" ? (
                      <div className="flex gap-2 items-center">

                        <FormControl fullWidth size="small">
                          <Select
                            value={item.size || ""}
                            onChange={(e) => handleChange(idx, "size", e.target.value)}
                            displayEmpty
                            disabled={isViewMode}

                            className="text-sm"
                          >
                            <MenuItem value="">
                              <span className="text-gray-400">Select Size</span>
                            </MenuItem>
                            {item.stockSizes?.map((size, i) => (
                              <MenuItem key={i} value={size}>
                                {size}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <div className="flex flex-col items-start">
                          <label className="text-[10px] text-gray-500 leading-none mb-1">
                            Ups
                          </label>
                          <input
                            type="number"
                            value={item.ups || ""}
                            onChange={(e) => handleChange(idx, "ups", e.target.value)}
                            placeholder="Ups"
                            disabled={isViewMode}

                            className="border px-2 py-1 text-sm w-16 rounded"
                          />
                        </div>

                        {/* Length */}
                        <div className="flex flex-col items-start">
                          <label className="text-[10px] text-gray-500 leading-none  mb-1">
                            Length (in)
                          </label>
                          <input
                            type="text"
                            value={item.one_up_length || ""}
                            disabled={isViewMode}

                            onChange={(e) =>
                              handleChange(idx, "one_up_length", e.target.value)
                            }
                            className="border px-2 py-1 text-sm w-16 rounded"
                          />
                        </div>

                        {/* Width */}
                        <div className="flex flex-col items-start">
                          <label className="text-[10px] text-gray-500 leading-none  mb-1">
                            Width (in)
                          </label>
                          <input
                            type="text"
                            value={item.one_up_width || ""}
                            disabled={isViewMode}

                            onChange={(e) =>
                              handleChange(idx, "one_up_width", e.target.value)
                            }
                            className="border px-2 py-1 text-sm w-16 rounded"
                          />
                        </div>

                      </div>
                    ) : (
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          value={item.quantity || ""}
                          disabled={isViewMode}

                          onChange={(e) =>
                            handleChange(idx, "quantity", e.target.value)
                          }
                          placeholder="Input"
                          className="border px-2 py-1 text-sm w-20 rounded"
                        />

                        <FormControl fullWidth size="small">
                          <Select
                            value={item.unit || ""}
                            disabled={isViewMode}

                            onChange={(e) =>
                              handleChange(idx, "unit", e.target.value)
                            }
                            displayEmpty
                            className="text-sm"
                          >
                            <MenuItem value="">
                              <span className="text-gray-400">Select</span>
                            </MenuItem>
                            <MenuItem value="Unit">Unit</MenuItem>
                            <MenuItem value="Job">Job</MenuItem>
                          </Select>
                        </FormControl>
                      </div>
                    )}
                  </td>


                  <td className="border px-2 py-1">
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={item.wastage}
                        disabled={isViewMode}

                        onChange={(e) =>
                          handleChange(idx, "wastage", e.target.value)
                        }
                        className="border px-1 py-0.5 w-16"
                      />

                      <FormControl size="small" className="w-24">
                        <Select
                          value={item.wastagetype || ""}
                          onChange={(e) =>
                            handleChange(idx, "wastagetype", e.target.value)
                          }
                          displayEmpty
                          disabled={isViewMode}

                          className="text-sm"
                        >
                          <MenuItem value="">
                            <span className="text-gray-400">Select</span>
                          </MenuItem>
                          <MenuItem value="%">%</MenuItem>
                          <MenuItem value="count">Count</MenuItem>
                        </Select>
                      </FormControl>
                    </div>
                  </td>

                  <td className="border px-2 py-1">
                    {item.finalTotal} {item.itemType === "sheet" ? "Sheet" : "Pcs"}
                  </td>

                  <td className="border px-2 py-1 text-right">
                    {formatCurrency(unitRate)}
                  </td>

                  <td className="border px-2 py-1 text-right">
                    {formatCurrency(jobTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>

        </table>

        {/* Error Messages */}
        {errorMessages.length > 0 && (

          <div className="text-red-500 text-xs mt-1 block">
            {errorMessages.map((error, idx) => (
              <div key={idx}>
                <span className="font-bold">Item {error.index + 1}:</span>
                {error.errors.join(", ")}
              </div>
            ))}
          </div>

        )}

      </div>

      {/*  TOTAL COST CENTER BOX */}
      <div className="flex justify-center w-full mt-9">
        <div className="rounded-xl shadow-lg px-16 py-10 max-w-3xl w-full bg-black">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-8 text-white">

            {/* Total Unit Cost */}
            <div className="flex flex-col items-center flex-1 pr-0 sm:pr-8 sm:border-r border-gray-700">
              <div className="text-sm font-medium text-gray-300 mb-2">
                Total Unit Cost
              </div>
              <div className="text-3xl font-extrabold text-white">
                {formatCurrency(grandTotals.totalUnitCost)}
              </div>
            </div>

            {/* Total Job Cost */}
            <div className="flex flex-col items-center flex-1 pl-0 sm:pl-8">
              <div className="text-sm font-medium text-gray-300 mb-2">
                Total Job Cost
              </div>
              <div className="text-3xl font-extrabold text-white">
                {formatCurrency(grandTotals.totalJobCost)}
              </div>
            </div>

          </div>
        </div>
      </div>




      <div className="flex justify-between mt-4">
        <button onClick={handleBack} className="px-4 py-2 rounded-md bg-orange-500 text-white border border-orange-600 hover:bg-orange-600">Back</button>
        <div className="flex gap-2">
          <button onClick={onSaveDraftClick} className="px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-700">Save as Draft</button>
          <button onClick={onNextClick} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Next</button>
        </div>
      </div>
    </div>
  );
}
