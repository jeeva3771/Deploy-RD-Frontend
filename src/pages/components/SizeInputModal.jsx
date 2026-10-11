import React, { useState, useEffect } from "react";
import { FormControl, Select, MenuItem } from "@mui/material";

const SizeInputModal = ({
  open,
  onClose,
  unitsList,
  loadingUnits,
  unit,
  setUnit,
  productSize,
  setProductSize,
  onSave,
  savingSize,
}) => {
  const [unitValues, setUnitValues] = useState([]);

  useEffect(() => {
    if (unit) {
      const selectedUnit = unitsList.find((u) => u.name === unit);
      setUnitValues(selectedUnit?.values || []);
      setProductSize({}); // reset size fields when unit changes
    }
  }, [unit, unitsList, setProductSize]);

  if (!open) return null;

  // Check if all fields are filled
  const allFieldsFilled =
    unit &&
    unitValues.length > 0 &&
    unitValues.every((param) => productSize?.[param] && productSize[param].trim() !== "");


const handleCloseModal = () => {
  setUnit("");            
  setProductSize({});     
  onClose();              
};


  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleCloseModal}
    >
      <div
        className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-[90%] sm:max-w-md shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">
          Add Product Size
        </h2>

        {/* Unit dropdown */}
        <div className="mb-3">
          <FormControl fullWidth variant="outlined" size="small">
            <label
              className="block text-xs sm:text-sm font-medium mb-1"
              htmlFor="unit-select"
            >
              Unit <span className="text-red-500">*</span>
            </label>

            {loadingUnits ? (
              <p className="text-sm text-gray-500">Loading units...</p>
            ) : (
              <Select
                id="unit-select"
                value={unit || ""}
                onChange={(e) => setUnit(e.target.value)}
                displayEmpty
                size="small"
                className="text-sm sm:text-base"
              >
                <MenuItem value="">
                  <span className="text-gray-400">Select Unit</span>
                </MenuItem>
                {unitsList.map((u) => (
                  <MenuItem key={u._id || u.id} value={u.name}>
                    {u.name}
                  </MenuItem>
                ))}
              </Select>
            )}
          </FormControl>
        </div>

        {/* Product size input fields */}
        {unit && unitValues.length > 0 && (
          <div className="mb-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {unitValues.map((param) => (
                <div key={param}>
                  <label className="block text-sm font-medium mb-1">
                    {param} <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={productSize?.[param] || ""}
                    onChange={(e) => {
                      const numericValue = e.target.value.replace(/[^0-9.]/g, "");
                      const cleanedValue = numericValue.replace(/(\..*?)\..*/g, "$1");
                      setProductSize((prev) => ({
                        ...prev,
                        [param]: cleanedValue,
                      }));
                    }}
                    placeholder={`Enter ${param}`}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2 mt-4">
          <button
            className="w-full sm:w-auto px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm sm:text-base font-medium transition-colors"
            onClick={handleCloseModal}
          >
            Cancel
          </button>
          <button
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onSave}
            disabled={savingSize || !allFieldsFilled}
          >
            {savingSize ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SizeInputModal;
