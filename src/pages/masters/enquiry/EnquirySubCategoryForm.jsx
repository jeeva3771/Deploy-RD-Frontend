import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { axiosInstance, backendUrl } from "../../../utils/url/config";
import { useLoader } from "../../../context/LoaderContext";
import { toast } from "react-toastify";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { useDispatch, useSelector } from "react-redux";
import {
  getEnquirySubCategoryById,
  createEnquirySubCategory,
  updateEnquirySubCategory,
} from "../../../reducer/enquirySubCategoryReducer"

const EnquirySubCategoryForm = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showLoader, hideLoader } = useLoader();

  const [formData, setFormData] = useState({
    name: "",
    isActive: null,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const { singleEnquirySubCategory } = useSelector(state => state.enquirySubCategories);

  const fetchCategory = useCallback(async () => {
    showLoader();
    try {
      await dispatch(getEnquirySubCategoryById(categoryId));
    } catch {
      toast.error("Failed to load enquiry category data");
    } finally {
      hideLoader();
    }
  }, [dispatch, categoryId, showLoader, hideLoader]);


  useEffect(() => {
    if (!categoryId) return;
    fetchCategory();
  }, [fetchCategory, categoryId]);

  useEffect(() => {
    if (!categoryId || !singleEnquirySubCategory) return

    setFormData({
      name: singleEnquirySubCategory.name,
      isActive: singleEnquirySubCategory.is_active,
    });
  }, [categoryId, singleEnquirySubCategory])

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "isActive") {
      setFormData((prev) => ({ ...prev, [name]: value === "active" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Category Name is required";
    if (formData.isActive === null) newErrors.isActive = "Please select status";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the highlighted errors");
      return;
    }

    const payload = {
      name: formData.name,
      is_active: formData.isActive,
    };

    setIsLoading(true);
    showLoader();

    try {
      let res;
      if (categoryId) {

        await dispatch(updateEnquirySubCategory({ id: categoryId, formData: payload }));
        toast.success(res?.data?.message || "Enquiry enquirysubcategory updated successfully");
        navigate("/enquirysubcategory");
      } else {
        await dispatch(createEnquirySubCategory(payload));
        toast.success(res?.data?.message || "Enquiry enquirysubcategory created successfully");
        navigate("/enquirysubcategory");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit data");
    } finally {
      setIsLoading(false);
      hideLoader();
    }
  };



  const resetForm = () => {
    setFormData({ name: "", isActive: null });
    setErrors({});
  };

  return (
    <div className="bg-gray-100 font-sans min-h-screen" style={{ marginTop: "80px" }}>
      <div className="flex items-center justify-center p-4">
        <div className="w-full max-w-3xl bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Header */}
          <div className="border-b border-gray-100 p-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">
              {categoryId ? "Edit Enquiry Category" : "Create Enquiry Category"}
            </h1>
            <button
              onClick={() => navigate(-1)}
              className="text-sm hover:bg-blue-200 text-blue-600 font-semibold py-2 px-4 rounded"
            >
              <KeyboardBackspaceIcon />
            </button>
          </div>

          {/* Form */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Name */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${errors.name ? "border-red-500" : "border-gray-300"
                    } focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition`}
                  placeholder="Enter category name"
                />
                {errors.name && <p className="text-red-600 text-sm">{errors.name}</p>}
              </div>

              {/* Status */}
              <FormControl fullWidth variant="outlined" size="small">
                <label
                  className="block text-sm font-semibold text-gray-700 mb-2"
                  htmlFor="isActive"
                >
                  Status <span className="text-red-600">*</span>
                </label>
                <Select
                  id="isActive"
                  name="isActive"
                  value={formData.isActive === null ? "" : formData.isActive ? "active" : "inactive"}
                  onChange={handleInputChange}
                  displayEmpty
                  size="small"
                  className={`${errors.isActive ? "border-red-500" : ""}`}
                >
                  <MenuItem value="">
                    <span className="text-[var(--theme-text-muted)]">Select status</span>
                  </MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
                {errors.isActive && <p className="text-red-600 text-sm mt-1">{errors.isActive}</p>}
              </FormControl>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              {categoryId ? (
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                  style={{ backgroundColor: "#574fdd" }}

                >
                  {isLoading ? "Updating..." : "Update"}
                </button>
              ) : (
                <>
                  <button
                    onClick={resetForm}
                    className="px-5 py-2.5 bg-white border border-red-500 text-red-500 hover:bg-red-50 font-medium rounded-lg transition"
                    type="button"
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                    style={{ backgroundColor: "#574fdd" }}
                  >
                    {isLoading ? "Submitting..." : "Submit"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnquirySubCategoryForm;
