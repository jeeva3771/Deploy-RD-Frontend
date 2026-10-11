// src/pages/servicecategory/ServiceCategoryForm.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import {
  fetchServiceCategoryById,
  createServiceCategory,
  updateServiceCategory,
  clearSelected,
} from "../../../reducer/serviceCategoryReducer";

const ServiceCategoryForm = () => {
  const { serviceCategoryId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { singleCategory, loading } = useSelector((state) => state.serviceCategory);

  const [formData, setFormData] = useState({
    name: "",
    isActive: null,
  });
  const [errors, setErrors] = useState({});
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);

  // fetch on edit
  useEffect(() => {
    if (serviceCategoryId) {
      dispatch(fetchServiceCategoryById(serviceCategoryId)).unwrap().catch((err) => {
        toast.error(err?.message || "Failed to load service category data");
      });
    }

    return () => {
      dispatch(clearSelected());
    };
  }, [serviceCategoryId, dispatch]);

  useEffect(() => {
    if (singleCategory && serviceCategoryId) {
      setFormData({
        name: singleCategory.name || "",
        isActive: singleCategory.is_active,
      });
    }
  }, [singleCategory, serviceCategoryId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setErrors((p) => ({ ...p, [name]: "" }));
    if (name === "isActive") {
      setFormData((p) => ({ ...p, [name]: value === "active" }));
    } else {
      setFormData((p) => ({ ...p, [name]: value }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (formData.isActive === null) newErrors.isActive = "Please select Active or Inactive";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({ name: "", isActive: null });
    setErrors({});
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

    setIsLoadingLocal(true);
    try {
      if (serviceCategoryId) {
        await dispatch(updateServiceCategory({ id: serviceCategoryId, payload })).unwrap();
        toast.success("Service category updated successfully");
      } else {
        await dispatch(createServiceCategory(payload)).unwrap();
        toast.success("Service category created successfully");
      }
      navigate("/servicecategory");
    } catch (err) {
      toast.error(err?.message || "Failed to submit service category data");
    } finally {
      setIsLoadingLocal(false);
    }
  };

  return (
    <div className="bg-gray-100 font-sans min-h-screen form-display" style={{ marginTop: "80px" }}>
      <div className="form-display flex items-center justify-center p-4">
        <div className="w-full max-w-5xl bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-100 p-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">{serviceCategoryId ? "Edit Service Category" : "Create Service Category"}</h1>
            <button onClick={() => navigate(-1)} className="text-sm hover:bg-blue-200 text-blue-600 font-semibold py-2 px-4 rounded">
              <KeyboardBackspaceIcon />
            </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className={`w-full px-4 py-2.5 rounded-lg border ${errors.name ? "border-red-500" : "border-gray-300"}`} placeholder="Enter service category name" />
                {errors.name && <p className="text-red-600 text-sm">{errors.name}</p>}
              </div>

              <FormControl fullWidth variant="outlined" size="small">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status <span className="text-red-600">*</span></label>
                <Select id="isActive" name="isActive" value={formData.isActive === null ? "" : (formData.isActive ? "active" : "inactive")} onChange={handleInputChange} displayEmpty size="small">
                  <MenuItem value=""><span className="text-[var(--theme-text-muted)]">Select status</span></MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
                {errors.isActive && <p className="text-red-600 text-sm mt-1">{errors.isActive}</p>}
              </FormControl>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              {serviceCategoryId ? (
                <button onClick={handleSubmit} className="px-6 py-2.5 primary-bgclr hover:bg-blue-600 text-white font-medium rounded-lg transition" style={{ backgroundColor: "#574fdd" }}
                >{isLoadingLocal || loading ? "Updating..." : "Update"}</button>
              ) : (
                <>
                  <button onClick={resetForm} className="px-5 py-2.5 bg-white border border-red-500 text-red-500 hover:bg-red-50 font-medium rounded-lg transition">Reset</button>
                  <button onClick={handleSubmit} className="px-6 py-2.5 primary-bgclr hover:bg-blue-600 text-white font-medium rounded-lg transition" style={{ backgroundColor: "#574fdd" }}>{isLoadingLocal ? "Submitting..." : "Submit"}</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceCategoryForm;
