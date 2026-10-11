import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUnitById,
  createUnit,
  updateUnit,
  clearSelectedUnit,
} from "../../../reducer/unitReducer";
import { toast } from "react-toastify";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

const UnitForm = () => {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { selectedUnit, loading } = useSelector((state) => state.unit);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    quantity_measured: "",
    si_unit: "",
    imperial_unit: "",
    imperial_symbol: "",
    is_active: null,
    values: [],
  });

  const [newValue, setNewValue] = useState("");
  const [errors, setErrors] = useState({});

  // Fetch existing unit (edit mode)
  useEffect(() => {
    if (unitId) {
      const fetchData = async () => {
        try {
          await dispatch(fetchUnitById(unitId)).unwrap();
        } catch (error) {
          toast.error(error?.message || "Failed to load unit data");
        }
      };
      fetchData();
    }

    return () => {
      dispatch(clearSelectedUnit());
    };
  }, [unitId, dispatch]);

  // Populate form when selectedUnit is loaded
  useEffect(() => {
    if (selectedUnit && unitId) {
      setFormData({
        name: selectedUnit.name || "",
        category: selectedUnit.category || "",
        quantity_measured: selectedUnit.quantity_measured || "",
        si_unit: selectedUnit.si_unit || "",
        imperial_unit: selectedUnit.imperial_unit || "",
        imperial_symbol: selectedUnit.imperial_symbol || "",
        is_active: selectedUnit.is_active,
        values: selectedUnit.values || [],
      });
    }
  }, [selectedUnit, unitId]);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "is_active") {
      setFormData((prev) => ({ ...prev, [name]: value === "active" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Add new unit value
  const addValue = () => {
    if (!newValue.trim()) {
      setErrors((prev) => ({ ...prev, values: "Value is required" }));
      return;
    }
    if (formData.values.includes(newValue.trim())) {
      toast.error("Value already added");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      values: [...prev.values, newValue.trim()],
    }));
    setNewValue("");
    setErrors((prev) => ({ ...prev, values: "" }));
  };

  // Remove a value
  const removeValue = (index) => {
    setFormData((prev) => ({
      ...prev,
      values: prev.values.filter((_, i) => i !== index),
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "SI Symbol is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.quantity_measured.trim())
      newErrors.quantity_measured = "Quantity measured is required";
    if (!formData.si_unit.trim()) newErrors.si_unit = "SI Unit is required";
    if (!formData.imperial_unit.trim())
      newErrors.imperial_unit = "Imperial Unit is required";
    if (!formData.imperial_symbol.trim())
      newErrors.imperial_symbol = "Imperial Symbol is required";
    if (formData.is_active === null)
      newErrors.is_active = "Please select Active or Inactive status";
    if (formData.values.length === 0)
      newErrors.values = "At least one value is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the highlighted errors");
      return;
    }

    const payload = { ...formData, name: formData.name.trim() };

    try {
      if (unitId) {
        await dispatch(updateUnit({ id: unitId, formData: payload })).unwrap();
        toast.success("Unit updated successfully");
      } else {
        await dispatch(createUnit(payload)).unwrap();
        toast.success("Unit created successfully");
      }
      navigate("/units");
    } catch (err) {
      const errorMessage = err?.message || "Failed to submit the unit data";
      toast.error(errorMessage);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      quantity_measured: "",
      si_unit: "",
      imperial_unit: "",
      imperial_symbol: "",
      is_active: null,
      values: [],
    });
    setErrors({});
    setNewValue("");
  };

  return (
    <div className="bg-gray-100 font-sans min-h-screen" style={{ marginTop: "80px" }}>
      <div className="flex items-center justify-center p-4">
        <div className="w-full max-w-5xl bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-100 p-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">
              {unitId ? "Edit Unit" : "Create Unit"}
            </h1>
            <button
              onClick={() => navigate(-1)}
              className="text-sm hover:bg-blue-200 text-blue-600 font-semibold py-2 px-4 rounded"
            >
              <KeyboardBackspaceIcon />
            </button>
          </div>

          <div className="p-6">
            {/* Unit Basic Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Category Dropdown */}
              <div className="space-y-2">
                <FormControl fullWidth variant="outlined" size="small">
                  <label
                    className="block text-sm font-semibold text-gray-700 mb-2"
                    htmlFor="category-select"
                  >
                    Category <span className="text-red-500">*</span>
                  </label>

                  <Select
                    id="category-select"
                    name="category"
                    value={formData.category || ""}
                    onChange={handleInputChange}
                    displayEmpty
                    size="small"
                  >
                    <MenuItem value="">
                      <span className="text-[var(--theme-text-muted)]">
                        Select category
                      </span>
                    </MenuItem>
                    <MenuItem value="Size (Length/Dimension)">
                      Size (Length/Dimension)
                    </MenuItem>
                    <MenuItem value="Size (Area)">Size (Area)</MenuItem>
                    <MenuItem value="Size (Volume/Capacity)">
                      Size (Volume/Capacity)
                    </MenuItem>
                    <MenuItem value="Weight (Mass)">Weight (Mass)</MenuItem>
                    <MenuItem value="Time">Time</MenuItem>
                  </Select>

                  {errors.category && (
                    <p className="text-red-600 text-sm mt-1">{errors.category}</p>
                  )}
                </FormControl>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Quantity Measured <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="quantity_measured"
                  value={formData.quantity_measured}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${errors.quantity_measured ? "border-red-500" : "border-gray-300"
                    } focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition`}
                  placeholder="Enter quantity measured"
                />
                {errors.quantity_measured && (
                  <p className="text-red-600 text-sm">{errors.quantity_measured}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  SI Unit <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="si_unit"
                  value={formData.si_unit}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${errors.si_unit ? "border-red-500" : "border-gray-300"
                    } focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition`}
                  placeholder="Enter SI unit"
                />
                {errors.si_unit && <p className="text-red-600 text-sm">{errors.si_unit}</p>}
              </div>

              {/* Unit Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  SI Symbol <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${errors.name ? "border-red-500" : "border-gray-300"
                    } focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition`}
                  placeholder="Enter unit name"
                />
                {errors.name && <p className="text-red-600 text-sm">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Imperial Unit <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="imperial_unit"
                  value={formData.imperial_unit}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${errors.imperial_unit ? "border-red-500" : "border-gray-300"
                    } focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition`}
                  placeholder="Enter imperial unit"
                />
                {errors.imperial_unit && (
                  <p className="text-red-600 text-sm">{errors.imperial_unit}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Imperial Symbol <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="imperial_symbol"
                  value={formData.imperial_symbol}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${errors.imperial_symbol ? "border-red-500" : "border-gray-300"
                    } focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition`}
                  placeholder="Enter imperial symbol"
                />
                {errors.imperial_symbol && (
                  <p className="text-red-600 text-sm">{errors.imperial_symbol}</p>
                )}
              </div>

              {/* Status */}
              <div className="mb-8">
                <FormControl fullWidth variant="outlined" size="small">
                  <label
                    className="block text-sm font-semibold text-gray-700 mb-2"
                    htmlFor="status-select"
                  >
                    Status <span className="text-red-500">*</span>
                  </label>

                  <Select
                    id="status-select"
                    name="is_active"
                    value={
                      formData.is_active === null
                        ? ""
                        : formData.is_active
                          ? "active"
                          : "inactive"
                    }
                    onChange={handleInputChange}
                    displayEmpty
                    size="small"
                  >
                    <MenuItem value="">
                      <span className="text-[var(--theme-text-muted)]">
                        Select status
                      </span>
                    </MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>

                  {errors.is_active && (
                    <p className="text-red-600 text-sm mt-1">{errors.is_active}</p>
                  )}
                </FormControl>
              </div>
            </div>

            {/* Unit Values Section */}
            <div className="mb-6">
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                Unit Parameters <span className="text-red-500">*</span>
              </label>

              <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0 mb-4">
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                  placeholder="Enter unit value"
                />
                <button
                  onClick={addValue}
                  type="button"
                  className="w-full sm:w-auto px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition"
                  style={{ backgroundColor: "#574fdd" }}
                >
                  + Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.values.map((val, index) => (
                  <div
                    key={index}
                    className="flex items-center px-3 py-2 bg-white border border-gray-200 rounded-lg hover:shadow-md transition w-full sm:w-auto"
                  >
                    <span className="flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full mr-2">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 flex-1">{val}</span>
                    <button
                      onClick={() => removeValue(index)}
                      className="text-red-500 hover:text-red-600 ml-2"
                      type="button"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {errors.values && (
                <p className="text-red-600 text-sm mt-1">{errors.values}</p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              {unitId ? (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition disabled:opacity-50"
                  style={{ backgroundColor: "#574fdd" }}

                >
                  {loading ? "Updating..." : "Update"}
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
                    disabled={loading}
                    className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition disabled:opacity-50"
                    style={{ backgroundColor: "#574fdd" }}
                  >
                    {loading ? "Submitting..." : "Submit"}
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

export default UnitForm;