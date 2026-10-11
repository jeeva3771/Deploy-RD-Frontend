import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchVendorById,
  createVendor,
  updateVendor,
  clearSelectedVendor,
} from "../../../reducer/vendorReducer";
import { fetchAllCategories as fetchAllMaterialCategories } from "../../../reducer/inventory/common/materialCategoryReducer";
import { fetchAllTypes as fetchAllMaterialTypes } from "../../../reducer/inventory/common/materialTypeReducer";
import { fetchAllContractTypes } from "../../../reducer/contractTypeReducer";
import { toast } from "react-toastify";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
import { capitalizeFirst } from "../../../utils/helper/capitalize";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";

const VendorForm = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux state - Vendor
  const { selectedVendor, loading } = useSelector((state) => state.vendor);

  // Redux state - Contract Types (correct selector)
  const { contractTypes, loading: contractTypesLoading } = useSelector(
    (state) => state.contractType
  );

  // Redux state - Material Categories
  const { categories: materialCategories, loading: materialCategoriesLoading } =
    useSelector((state) => state.materialCategories);

  // Redux state - Material Types
  const { types: materialTypes, loading: materialTypesLoading } =
    useSelector((state) => state.materialTypes);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile_no: "",
    material_categories: [],
    material_types: [],
    contract_type: "",
    address: "",
    isActive: null,
  });

  const [errors, setErrors] = useState({});

  const isEdit = Boolean(vendorId);
  const optionsLoading = contractTypesLoading;

  // Fetch dropdown options on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        await Promise.all([
          dispatch(fetchAllContractTypes({ sortBy: "name", order: "asc", is_active: true })).unwrap(),
          dispatch(fetchAllMaterialCategories({ sortBy: "name", order: "asc", is_active: true })).unwrap(),
          dispatch(fetchAllMaterialTypes({ sortBy: "name", order: "asc", is_active: true })).unwrap(),
        ]);
      } catch (error) {
        toast.error(error?.message || "Failed to load options");
      }
    };

    fetchOptions();
  }, [dispatch]);

  // Fetch vendor data when editing
  useEffect(() => {
    if (vendorId) {
      const fetchData = async () => {
        try {
          await dispatch(fetchVendorById(vendorId)).unwrap();
        } catch (error) {
          toast.error(error?.message || "Failed to load vendor data");
        }
      };
      fetchData();
    }

    return () => {
      dispatch(clearSelectedVendor());
    };
  }, [vendorId, dispatch]);

  // Populate form when selectedVendor is loaded
  useEffect(() => {
    if (selectedVendor && vendorId) {
      setFormData({
        name: selectedVendor.name || "",
        email: selectedVendor.email || "",
        mobile_no: selectedVendor.mobile_no?.toString() || "",
        material_categories: (selectedVendor.material_categories || []).map(cat => cat._id || cat),
        material_types: (selectedVendor.material_types || []).map(t => t._id || t),
        contract_type: selectedVendor.contract_type?._id || selectedVendor.contract_type || "",
        address: selectedVendor.address || "",
        isActive: selectedVendor.is_active,
      });
    }
  }, [selectedVendor, vendorId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "isActive") {
      setFormData((prev) => ({ ...prev, [name]: value === "active" }));
    } else if (name === "mobile_no") {
      const numericValue = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!formData.name.trim()) newErrors.name = "Vendor Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!emailRegex.test(formData.email))
      newErrors.email = "Please enter a valid email address";

    if (!formData.mobile_no && !vendorId)
      newErrors.mobile_no = "Mobile number is required";
    else if (formData.mobile_no && formData.mobile_no.length !== 10)
      newErrors.mobile_no = "Enter a valid 10-digit mobile number";

    if (formData.material_categories.length === 0)
      newErrors.material_categories = "Material Category is required";
    if (formData.material_types.length === 0)
      newErrors.material_types = "Material Type is required";
    if (!formData.contract_type)
      newErrors.contract_type = "Contract Type is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (formData.isActive === null)
      newErrors.isActive = "Please select Active or Inactive status";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      mobile_no: "",
      material_categories: [],
      material_types: [],
      contract_type: "",
      address: "",
      isActive: null,
    });
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the highlighted errors");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      mobile_no: Number(formData.mobile_no),
      material_categories: formData.material_categories,
      material_types: formData.material_types,
      contract_type: formData.contract_type,
      address: formData.address.trim(),
      is_active: formData.isActive ? 1 : 0,
    };

    try {
      if (isEdit) {
        await dispatch(
          updateVendor({ id: vendorId, formData: payload })
        ).unwrap();
        toast.success("Vendor updated successfully");
      } else {
        await dispatch(createVendor(payload)).unwrap();
        toast.success("Vendor created successfully");
      }
      navigate("/vendor");
    } catch (err) {
      const msg = err?.message || "Failed to submit the vendor data";
      toast.error(msg);
    }
  };

  return (
    <div
      className="bg-gray-100 font-sans min-h-screen form-display"
      style={{ marginTop: "80px" }}
    >
      <div className="form-display flex items-center justify-center p-4">
        <div className="w-full max-w-6xl bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-100 p-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">
              {vendorId ? "Edit Supply Vendor" : "Create Supply Vendor"}
            </h1>
            <button
              onClick={() => navigate(-1)}
              className="text-sm hover:bg-blue-200 text-blue-600 font-semibold py-2 px-4 rounded"
            >
              <KeyboardBackspaceIcon />
            </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Vendor Name */}
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Supply Vendor Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${errors.name ? "border-red-500" : "border-gray-300"
                    } focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition`}
                  placeholder="Enter vendor name"
                />
                {errors.name && (
                  <p className="text-red-600 text-sm">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${errors.email ? "border-red-500" : "border-gray-300"
                    } focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition`}
                  placeholder="Enter email"
                />
                {errors.email && (
                  <p className="text-red-600 text-sm">{errors.email}</p>
                )}
              </div>

              {/* Mobile */}
              <div className="space-y-2">
                <label
                  htmlFor="mobile_no"
                  className="block text-sm font-medium text-gray-700"
                >
                  Mobile No <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="mobile_no"
                  name="mobile_no"
                  value={formData.mobile_no}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${errors.mobile_no ? "border-red-500" : "border-gray-300"
                    } focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition`}
                  placeholder="Enter 10-digit mobile number"
                />
                {errors.mobile_no && (
                  <p className="text-red-600 text-sm">{errors.mobile_no}</p>
                )}
              </div>

              {/* Material Types (Multiselect) */}
              <div className="space-y-2">
                <FormControl fullWidth variant="outlined" size="small">
                  <label
                    className="block text-sm font-semibold text-gray-700 mb-2"
                    htmlFor="material-types-select"
                  >
                    Material Types <span className="text-red-500">*</span>
                  </label>

                  <Select
                    id="material-types-select"
                    name="material_types"
                    multiple
                    value={formData.material_types}
                    onChange={handleInputChange}
                    displayEmpty
                    size="small"
                    error={!!errors.material_types}
                    disabled={optionsLoading || materialTypesLoading}
                    renderValue={(selected) => {
                      if (selected.length === 0) {
                        return <span className="text-[var(--theme-text-muted)]">Select material types</span>;
                      }
                      return selected
                        .map((id) => {
                          const t = materialTypes.find((type) => type._id === id);
                          return t ? capitalizeFirst(t.name) : id;
                        })
                        .join(", ");
                    }}
                  >
                    <MenuItem disabled value="">
                      <span className="text-[var(--theme-text-muted)]">
                        Select material types
                      </span>
                    </MenuItem>

                    {materialTypes.map((type) => (
                      <MenuItem key={type._id} value={type._id}>
                        {capitalizeFirst(type.name)}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.material_types && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.material_types}
                    </p>
                  )}
                </FormControl>
              </div>

              {/* Material Categories (Multiselect) */}
              <div className="space-y-2">
                <FormControl fullWidth variant="outlined" size="small">
                  <label
                    className="block text-sm font-semibold text-gray-700 mb-2"
                    htmlFor="material-categories-select"
                  >
                    Material Categories <span className="text-red-500">*</span>
                  </label>

                  <Select
                    id="material-categories-select"
                    name="material_categories"
                    multiple
                    value={formData.material_categories}
                    onChange={handleInputChange}
                    displayEmpty
                    size="small"
                    error={!!errors.material_categories}
                    disabled={optionsLoading || materialCategoriesLoading}
                    renderValue={(selected) => {
                      if (selected.length === 0) {
                        return <span className="text-[var(--theme-text-muted)]">Select material categories</span>;
                      }
                      return selected
                        .map((id) => {
                          const cat = materialCategories.find((c) => c._id === id);
                          return cat ? capitalizeFirst(cat.name) : id;
                        })
                        .join(", ");
                    }}
                  >
                    <MenuItem disabled value="">
                      <span className="text-[var(--theme-text-muted)]">
                        Select material categories
                      </span>
                    </MenuItem>

                    {materialCategories.map((category) => (
                      <MenuItem key={category._id} value={category._id}>
                        {capitalizeFirst(category.name)}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.material_categories && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.material_categories}
                    </p>
                  )}
                </FormControl>
              </div>



              {/* Contract Type */}
              <div className="space-y-2">
                <FormControl fullWidth variant="outlined" size="small">
                  <label
                    className="block text-sm font-semibold text-gray-700 mb-2"
                    htmlFor="contract-type-select"
                  >
                    Contract Type <span className="text-red-500">*</span>
                  </label>

                  <Select
                    id="contract-type-select"
                    name="contract_type"
                    value={formData.contract_type}
                    onChange={handleInputChange}
                    displayEmpty
                    size="small"
                    error={!!errors.contract_type}
                    disabled={optionsLoading}
                  >
                    <MenuItem value="">
                      <span className="text-[var(--theme-text-muted)]">
                        Select contract type
                      </span>
                    </MenuItem>

                    {contractTypes.map((type) => (
                      <MenuItem key={type._id} value={type._id}>
                        {capitalizeFirst(type.name)}
                      </MenuItem>
                    ))}
                  </Select>

                  {errors.contract_type && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.contract_type}
                    </p>
                  )}
                </FormControl>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700"
                >
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${errors.address ? "border-red-500" : "border-gray-300"
                    } focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition`}
                  placeholder="Enter address"
                  rows="3"
                />
                {errors.address && (
                  <p className="text-red-600 text-sm">{errors.address}</p>
                )}
              </div>

              {/* Status */}
              <div className="space-y-2">
                <FormControl fullWidth variant="outlined" size="small">
                  <label
                    className="block text-sm font-semibold text-gray-700 mb-2"
                    htmlFor="status-select"
                  >
                    Status <span className="text-red-500">*</span>
                  </label>

                  <Select
                    id="status-select"
                    name="isActive"
                    value={
                      formData.isActive === null
                        ? ""
                        : formData.isActive
                          ? "active"
                          : "inactive"
                    }
                    onChange={handleInputChange}
                    displayEmpty
                    size="small"
                    error={!!errors.isActive}
                  >
                    <MenuItem value="">
                      <span className="text-[var(--theme-text-muted)]">
                        Select status
                      </span>
                    </MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>

                  {errors.isActive && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.isActive}
                    </p>
                  )}
                </FormControl>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              {vendorId ? (
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2.5 primary-bgclr hover:bg-blue-600 text-white font-medium rounded-lg transition flex items-center"
                  style={{ backgroundColor: "#574fdd" }}

                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg
                        className="w-4 h-4 mr-2 animate-spin"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                      Updating...
                    </>
                  ) : (
                    "Update"
                  )}
                </button>
              ) : (
                <>
                  <button
                    onClick={resetForm}
                    className="px-5 py-2.5 bg-white border border-red-500 text-red-500 hover:bg-red-50 font-medium rounded-lg transition flex items-center"
                    type="button"
                    disabled={loading}
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-2.5 primary-bgclr hover:bg-blue-600 text-white font-medium rounded-lg transition flex items-center"
                    style={{ backgroundColor: "#574fdd" }}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <svg
                          className="w-4 h-4 mr-2 animate-spin"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                          />
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      "Submit"
                    )}
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

export default VendorForm;