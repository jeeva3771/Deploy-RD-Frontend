import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllEnquiryCategories } from "../../reducer/enquiryCategoryReducer";
import { getAllEnquirySubCategories } from "../../reducer/enquirySubCategoryReducer";
import { FormControl, Select, MenuItem } from "@mui/material";

export default function JobDetails({
  handleNext,
  handleBack,
  formData,
  SamplesalesOrderdata,
}) {
  const dispatch = useDispatch();

  const { enquiryCategories = [] } = useSelector(
    (state) => state.enquiryCategories || {}
  );
  const { enquirySubCategories = [] } = useSelector(
    (state) => state.enquirySubCategories || {}
  );

  const [localData, setLocalData] = useState({
    jobQty: formData.jobQty || "",
    completionDate: formData.completionDate || "",
    category: formData.category || "",
    subcategory: formData.subcategory || "",
  });

  useEffect(() => {
    setLocalData({
      jobQty: formData.jobQty || "",
      completionDate: formData.completionDate || "",
      category: formData.category || "",
      subcategory: formData.subcategory || "",
    });
  }, [formData]);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    dispatch(
      getAllEnquiryCategories({
        is_active: true,
        order: "asc",
        sortField: "name",
      })
    );
    dispatch(
      getAllEnquirySubCategories({
        is_active: true,
        order: "asc",
        sortField: "name",
      })
    );
  }, [dispatch]);

  const handleChange = (e) => {
    setLocalData({ ...localData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validateForm = () => {
    let newErrors = {};
    if (!localData.jobQty) newErrors.jobQty = "Job quantity is required";
    if (!localData.completionDate)
      newErrors.completionDate = "Completion date is required";
    if (!localData.category) newErrors.category = "Please select a category";
    if (!localData.subcategory)
      newErrors.subcategory = "Please select a subcategory";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onNextClick = () => {
    if (validateForm()) handleNext(localData);
  };

  const capitalizeFirst = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <form className="flex flex-col gap-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">
        Job Details
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Job Quantity */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Job Quantity <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="jobQty"
            value={localData.jobQty}
            onChange={(e) => {
              const digitsOnly = e.target.value.replace(/[^0-9]/g, ""); 
              handleChange({
                target: { name: "jobQty", value: digitsOnly },
              });
            }}
            placeholder="Enter job quantity"
            className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-blue-600 focus:border-transparent ${
              errors.jobQty ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.jobQty && (
            <span className="text-red-500 text-xs sm:text-sm mt-1 block">
              {errors.jobQty}
            </span>
          )}
        </div>

        {/* Completion Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Job Completion Date & Time <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            name="completionDate"
            value={localData.completionDate}
            min={new Date().toISOString().slice(0, 16)}
            onChange={handleChange}
            className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent ${
              errors.completionDate ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.completionDate && (
            <span className="text-red-500 text-xs sm:text-sm mt-1 block">
              {errors.completionDate}
            </span>
          )}
        </div>

        {/* Category */}
        <FormControl fullWidth variant="outlined" size="small">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Category <span className="text-red-500">*</span>
          </label>

          <Select
            name="category"
            value={localData.category}
            onChange={handleChange}
            displayEmpty
            size="small"
            error={!!errors.category}
          >
            <MenuItem value="">
              <span className="text-gray-500">Select Category</span>
            </MenuItem>

            {enquiryCategories
              .slice()
              .sort((a, b) =>
                a.name.toLowerCase().localeCompare(b.name.toLowerCase())
              )
              .map((cat) => (
                <MenuItem key={cat.id} value={cat.name}>
                  {capitalizeFirst(cat.name)}
                </MenuItem>
              ))}
          </Select>

          {errors.category && (
            <p className="text-red-600 text-sm mt-1">{errors.category}</p>
          )}
        </FormControl>

        {/* Subcategory */}
        <FormControl fullWidth variant="outlined" size="small">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Subcategory <span className="text-red-500">*</span>
          </label>

          <Select
            name="subcategory"
            value={localData.subcategory}
            onChange={handleChange}
            displayEmpty
            size="small"
            error={!!errors.subcategory}
          >
            <MenuItem value="">
              <span className="text-gray-500">Select Subcategory</span>
            </MenuItem>

            {enquirySubCategories
              .slice()
              .sort((a, b) =>
                a.name.toLowerCase().localeCompare(b.name.toLowerCase())
              )
              .map((sub) => (
                <MenuItem key={sub.id} value={sub.name}>
                  {capitalizeFirst(sub.name)}
                </MenuItem>
              ))}
          </Select>

          {errors.subcategory && (
            <p className="text-red-600 text-sm mt-1">{errors.subcategory}</p>
          )}
        </FormControl>
      </div>

      {/* Buttons */}
      <div className="flex justify-between mt-4">
        <button
          type="button"
          disabled
          onClick={handleBack}
          className="px-4 py-2 rounded-md border border-gray-300 text-gray-500 cursor-not-allowed"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNextClick}
          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
        >
          Next
        </button>
      </div>
    </form>
  );
}
