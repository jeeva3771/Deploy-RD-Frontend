import React, { useEffect, useRef, useState } from "react";
import { FormControl, Select, MenuItem } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchinnerpackingtype,
  fetchpackingtype,
  fetchpremiumpackingtype,
} from "../../reducer/commonReducer";

export default function PackagingDetails({
  handleNext,
  handleBack,
  formData,
  setFormData,
}) {
  const [localData, setLocalData] = useState({
    packingType: formData.packingType || "",
    innerPackingType: formData.innerPackingType || "",
    premiumOptions: formData.premiumOptions || [],
    packingInstructions: formData.packingInstructions || "",
    packingMode: formData.packingMode || "",
    productFile: formData.productFile || [],
  });
  const fileInputRef = useRef();
  const [errors, setErrors] = useState({});
  const [dragOver, setDragOver] = useState(false);

  const dispatch = useDispatch();

  const {
    packingTypes,
    loadingPackingTypes,
    innerpackingTypes,
    loadinginnerPackingTypes,
    premiumpackingtype,
    loadingpremiumpackingtype,
  } = useSelector((state) => state.commondropdowns);

  useEffect(() => {
    dispatch(fetchpackingtype());
    dispatch(fetchinnerpackingtype());
    dispatch(fetchpremiumpackingtype());
  }, [dispatch]);

  const packingModes = ["Individual", "Consolidated", "Both"];
  // const premiumOptionsList = [
  //   "Certificate",
  //   "Gift Card",
  //   "Ribbon",
  //   "Custom Tag",
  //   "Instruction Manual",
  // ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Update local UI
    setLocalData((prev) => ({ ...prev, [name]: value }));

    // Update parent saved data
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleCheckboxChange = (option) => {
    let updated = [...localData.premiumOptions];
    if (updated.includes(option)) {
      updated = updated.filter((o) => o !== option);
    } else {
      updated.push(option);
    }
    setLocalData({ ...localData, premiumOptions: updated });
  };

  const validateForm = () => {
    let newErrors = {};

    if (!localData.packingType)
      newErrors.packingType = "Please select a packing type";
    if (!localData.innerPackingType)
      newErrors.innerPackingType = "Please select inner packing";
    if (!localData.packingMode)
      newErrors.packingMode = "Please select a packing mode";

    // file validation
    if (!localData.productFile || localData.productFile.length === 0)
      newErrors.productFile = "Please upload";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onNextClick = () => {
    if (validateForm()) handleNext(localData);
  };

  return (
    <form className="flex flex-col gap-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">
        Packaging Details
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Packing Type */}
        <FormControl fullWidth variant="outlined" size="small">
          <label
            className="block text-sm font-semibold text-gray-700 mb-2"
            htmlFor="packingType-select"
          >
            Type of Packing <span className="text-red-600">*</span>
          </label>

          <Select
            id="packingType-select"
            name="packingType"
            value={localData.packingType}
            onChange={handleChange}
            displayEmpty
            size="small"
            error={!!errors.packingType}
          >
            <MenuItem value="">
              <span className="text-[var(--theme-text-muted)]">
                Select Type of Packing
              </span>
            </MenuItem>

            {packingTypes.map((item) => (
              <MenuItem key={item._id} value={item.name}>
                {item.name}
              </MenuItem>
            ))}
          </Select>

          {errors.packingType && (
            <p className="text-red-600 text-sm mt-1">{errors.packingType}</p>
          )}
        </FormControl>

        {/* Inner Packing */}
        <FormControl fullWidth variant="outlined" size="small">
          <label
            className="block text-sm font-semibold text-gray-700 mb-2"
            htmlFor="innerPackingType-select"
          >
            Inner Packing Type <span className="text-red-600">*</span>
          </label>

          <Select
            id="innerPackingType-select"
            name="innerPackingType"
            value={localData.innerPackingType}
            onChange={handleChange}
            displayEmpty
            size="small"
            error={!!errors.innerPackingType}
          >
            <MenuItem value="">
              <span className="text-[var(--theme-text-muted)]">
                Select Inner Packing Type
              </span>
            </MenuItem>

            {innerpackingTypes.map((item) => (
              <MenuItem key={item._id} value={item.name}>
                {item.name}
              </MenuItem>
            ))}
          </Select>

          {errors.innerPackingType && (
            <p className="text-red-600 text-sm mt-1">
              {errors.innerPackingType}
            </p>
          )}
        </FormControl>
      </div>

      {/* Premium Packing Options */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Premium Packing Options
        </label>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
          {premiumpackingtype.map((option) => (
            <label
              key={option._id}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={localData.premiumOptions.includes(option.name)}
                onChange={() => handleCheckboxChange(option.name)}
              />
              <span className="text-sm">{option.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Packing Instructions */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Packing Instructions
        </label>
        <textarea
          name="packingInstructions"
          value={localData.packingInstructions}
          onChange={handleChange}
          placeholder="Enter detailed packing instructions..."
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        ></textarea>
      </div>

      {/* Packing Mode */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Packing Mode <span className="text-red-600">*</span>
        </label>

        <div className="flex gap-5 mt-2">
          {packingModes.map((mode) => (
            <label
              key={mode}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="radio"
                name="packingMode"
                value={mode}
                checked={localData.packingMode === mode}
                onChange={handleChange}
              />
              <span className="text-sm">{mode}</span>
            </label>
          ))}
        </div>

        {errors.packingMode && (
          <span className="text-red-500 text-sm">{errors.packingMode}</span>
        )}
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Job Content / Packing Excel Upload{" "}
          <span className="text-red-600">*</span>
        </label>

        {/* Upload Box */}
        <div
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);

            const files = Array.from(e.dataTransfer.files);
            if (files.length) {
              setLocalData((prev) => ({
                ...prev,
                productFile: [...(prev.productFile || []), ...files],
              }));
            }

            // Clear error
            setErrors((prev) => ({ ...prev, productFile: "" }));
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current.click()}
          className={`mt-2 flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer transition-all
          ${dragOver ? "bg-blue-50 border-blue-500" : "border-gray-300"}`}
        >
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="*/*" // allows all types
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files);
              if (files.length) {
                setLocalData((prev) => ({
                  ...prev,
                  productFile: [...(prev.productFile || []), ...files],
                }));

                // Clear error
                setErrors((prev) => ({ ...prev, productFile: "" }));
              }
            }}
          />

          <p className="text-sm text-gray-500 text-center">
            Click to upload or drag & drop files
          </p>
        </div>

        {/* Preview List */}
        {localData.productFile && localData.productFile.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {localData.productFile.map((file, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-2 border rounded-md bg-gray-50 text-sm"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const updated = [...localData.productFile];
                    updated.splice(index, 1);
                    setLocalData({ ...localData, productFile: updated });
                  }}
                  className="text-red-500 text-xs bg-red-100 px-2 py-1 rounded hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        {errors.productFile && (
          <span className="text-red-500 text-sm mt-1 block">
            {errors.productFile}
          </span>
        )}
      </div>

      {/* Buttons */}
      <div className="flex justify-between mt-4">
        <button
          type="button"
          onClick={handleBack}
          className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
        >
          Back
        </button>

        <button
          type="button"
          onClick={onNextClick}
          className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
        >
          Next
        </button>
      </div>
    </form>
  );
}
