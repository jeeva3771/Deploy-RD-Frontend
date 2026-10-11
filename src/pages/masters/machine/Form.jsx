import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMachineById,
  createMachine,
  updateMachine,
  clearSelectedMachine,
} from "../../../reducer/machineReducer";
import { getAllDepartments } from "../../../reducer/departmentReducer";
import { toast } from "react-toastify";
import { useLoader } from "../../../context/LoaderContext";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
import { capitalizeFirst } from "../../../utils/helper/capitalize";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

const MachineForm = () => {
  const { machineId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux state - Machine
  const { selectedMachine, loading } = useSelector((state) => state.machine);

  // Redux state - Department
  const { departments } = useSelector((state) => state.department);

  const [formData, setFormData] = useState({
    name: "",
    machine_number: "",
    isActive: null,
    type: "",
    location: "",
    commission_date: "",
    last_service_date: "",
    gross_cost: "",
    book_value: "",
    accumulated_depreciation: "",
  });

  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [maintenance, setMaintenance] = useState([]);
  const [newMaintenance, setNewMaintenance] = useState("");
  const [additionalFields, setAdditionalFields] = useState([]);
  const [newField, setNewField] = useState({ key: "", value: "" });
  const [errors, setErrors] = useState({});

  // Fetch departments on mount
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        await dispatch(getAllDepartments({ is_active: true, order: 'asc', params: { sortField: 'name', sortOrder: 'asc' } })).unwrap();
      } catch (error) {
        toast.error("Failed to load departments");
      }
    };
    fetchDepts();
  }, [dispatch]);

  // Fetch machine data when editing
  useEffect(() => {
    if (machineId) {
      const fetchData = async () => {
        try {
          await dispatch(fetchMachineById(machineId)).unwrap();
        } catch (error) {
          toast.error(error?.message || "Failed to load machine data");
        }
      };
      fetchData();
    }

    return () => {
      dispatch(clearSelectedMachine());
    };
  }, [machineId, dispatch]);

  // Populate form when selectedMachine is loaded
  useEffect(() => {
    if (selectedMachine && machineId) {
      setFormData({
        name: selectedMachine.name || "",
        machine_number: selectedMachine.machine_number || "",
        isActive: selectedMachine.is_active,
        type: selectedMachine.type || "",
        location: selectedMachine.location || "",
        commission_date: selectedMachine.commission_date || "",
        last_service_date: selectedMachine.last_service_date || "",
        gross_cost:
          selectedMachine.gross_cost !== undefined &&
            selectedMachine.gross_cost !== null
            ? selectedMachine.gross_cost
            : "",
        book_value:
          selectedMachine.book_value !== undefined &&
            selectedMachine.book_value !== null
            ? selectedMachine.book_value
            : "",
        accumulated_depreciation:
          selectedMachine.accumulated_depreciation !== undefined &&
            selectedMachine.accumulated_depreciation !== null
            ? selectedMachine.accumulated_depreciation
            : "",
      });

      // Handle department_id - could be object or string
      const deptId = selectedMachine.department_id?._id ||
        selectedMachine.department_id ||
        selectedMachine.department?._id ||
        "";
      setSelectedDepartmentId(deptId);

      setMaintenance(selectedMachine.maintanence || []);
      setAdditionalFields(selectedMachine.add_fields || []);
    }
  }, [selectedMachine, machineId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setErrors((prev) => ({ ...prev, [name]: "" }));

    if (name === "isActive") {
      setFormData((prev) => ({ ...prev, [name]: value === "active" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const calculateDepreciation = () => {
    const gross = parseFloat(formData.gross_cost) || 0;
    const book = parseFloat(formData.book_value) || 0;
    const dep = Math.max(0, gross - book);
    setFormData((prev) => ({
      ...prev,
      accumulated_depreciation: dep,
    }));
  };

  const handleDepartmentChange = (e) => {
    setSelectedDepartmentId(e.target.value);
    setErrors((prev) => ({ ...prev, department: "" }));
  };

  const addMaintenance = () => {
    if (!newMaintenance.trim()) {
      setErrors((prev) => ({
        ...prev,
        maintenance: "Maintenance task is required",
      }));
      return;
    }
    if (maintenance.includes(newMaintenance.trim())) {
      toast.error("Maintenance task already added");
      return;
    }
    setMaintenance((prev) => [...prev, newMaintenance.trim()]);
    setNewMaintenance("");
    setErrors((prev) => ({ ...prev, maintenance: "" }));
  };

  const removeMaintenance = (index) => {
    setMaintenance((prev) => prev.filter((_, i) => i !== index));
  };

  const addAdditionalField = () => {
    if (!newField.key.trim() || !newField.value.trim()) {
      toast.error("Both key and value are required for additional fields");
      return;
    }
    if (additionalFields.some((field) => field.key === newField.key)) {
      toast.error("Field key already exists");
      return;
    }
    setAdditionalFields((prev) => [...prev, { ...newField }]);
    setNewField({ key: "", value: "" });
  };

  const removeAdditionalField = (index) => {
    setAdditionalFields((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      machine_number: "",
      isActive: null,
      type: "",
      location: "",
      commission_date: "",
      last_service_date: "",
      gross_cost: "",
      book_value: "",
      accumulated_depreciation: "",
    });
    setSelectedDepartmentId("");
    setMaintenance([]);
    setNewMaintenance("");
    setAdditionalFields([]);
    setNewField({ key: "", value: "" });
    setErrors({});
  };

  const handleSubmit = async () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Machine Name is required";
    if (!formData.machine_number.trim())
      newErrors.machine_number = "Machine Number is required";
    if (!selectedDepartmentId)
      newErrors.department = "Department must be selected";
    if (formData.isActive === null)
      newErrors.isActive = "Please select Active or Inactive status";
    if (!formData.type) newErrors.type = "Please select type";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fix the highlighted errors");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      machine_number: formData.machine_number.trim(),
      department: selectedDepartmentId,
      maintanence: maintenance,
      add_fields: additionalFields,
      is_active: Boolean(formData.isActive),
      type: formData.type,
      location: formData.location?.trim() || "",
      commission_date: formData.commission_date || null,
      last_service_date: formData.last_service_date || null,
      gross_cost: formData.gross_cost ? Number(formData.gross_cost) : 0,
      book_value: formData.book_value ? Number(formData.book_value) : 0,
      accumulated_depreciation: formData.accumulated_depreciation
        ? Number(formData.accumulated_depreciation)
        : 0,
    };

    try {
      if (machineId) {
        await dispatch(
          updateMachine({ id: machineId, formData: payload })
        ).unwrap();
        toast.success("Machine updated successfully");
      } else {
        await dispatch(createMachine(payload)).unwrap();
        toast.success("Machine created successfully");
      }
      navigate("/machine");
    } catch (err) {
      const msg = err?.message || "Failed to submit the machine data";
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
              {machineId ? "Edit Machine" : "Create Machine"}
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
              {/* Machine Name */}
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Machine Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${errors.name ? "border-red-500" : "border-gray-300"
                    } focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition`}
                  placeholder="Enter machine name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Machine Number */}
              <div className="space-y-2">
                <label
                  htmlFor="machine_number"
                  className="block text-sm font-medium text-gray-700"
                >
                  Machine Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="machine_number"
                  name="machine_number"
                  value={formData.machine_number}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${errors.machine_number ? "border-red-500" : "border-gray-300"
                    } focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition`}
                  placeholder="Enter machine number"
                />
                {errors.machine_number && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.machine_number}
                  </p>
                )}
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-gray-700"
                >
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                  placeholder="e.g. Laser Studio / Bay 2"
                />
              </div>

              {/* Department */}
              <FormControl fullWidth variant="outlined" size="small">
                <label
                  className="block text-sm font-semibold text-gray-700 mb-2"
                  htmlFor="department-select"
                >
                  Department <span className="text-red-600">*</span>
                </label>

                <Select
                  name="department"
                  id="department"
                  value={selectedDepartmentId}
                  onChange={handleDepartmentChange}
                  displayEmpty
                  size="small"
                  error={!!errors.department}
                >
                  <MenuItem value="">
                    <span className="text-[var(--theme-text-muted)]">
                      Select Department
                    </span>
                  </MenuItem>

                  {departments && departments.length > 0 ? (
                    departments.map((dept) => (
                      <MenuItem key={dept._id || dept.id} value={dept._id || dept.id}>
                        {capitalizeFirst(dept.name)} - {dept.type}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>
                      <span className="text-gray-400">No departments available</span>
                    </MenuItem>
                  )}
                </Select>

                {errors.department && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.department}
                  </p>
                )}
              </FormControl>

              {/* Status */}
              <FormControl fullWidth variant="outlined" size="small">
                <label
                  className="block text-sm font-semibold text-gray-700 mb-2"
                  htmlFor="status-select"
                >
                  Status <span className="text-red-600">*</span>
                </label>

                <Select
                  name="isActive"
                  id="isActive"
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
                      Select Status
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

              {/* Machine Type */}
              <FormControl fullWidth variant="outlined" size="small">
                <label
                  className="block text-sm font-semibold text-gray-700 mb-2"
                  htmlFor="type-select"
                >
                  Machine Type <span className="text-red-600">*</span>
                </label>

                <Select
                  name="type"
                  id="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  displayEmpty
                  size="small"
                  error={!!errors.type}
                >
                  <MenuItem value="">
                    <span className="text-[var(--theme-text-muted)]">
                      Select type
                    </span>
                  </MenuItem>
                  <MenuItem value="In House">In House</MenuItem>
                  <MenuItem value="Out Source">Out Source</MenuItem>
                  <MenuItem value="Both">Both</MenuItem>
                </Select>

                {errors.type && (
                  <p className="text-red-600 text-sm mt-1">{errors.type}</p>
                )}
              </FormControl>
            </div>

            {/* Operational Dates Section */}
            <div className="bg-slate-50/80 p-5 rounded-xl border border-slate-200 mb-8">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <i className="fa-regular fa-calendar-check text-indigo-600"></i> Operational & Commissioning Dates
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Track procurement date and the most recent maintenance servicing</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Purchase / Commission Date */}
                <div className="space-y-2">
                  <label
                    htmlFor="commission_date"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Purchase / Commission Date
                  </label>
                  <input
                    type="date"
                    id="commission_date"
                    name="commission_date"
                    value={formData.commission_date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition bg-white"
                  />
                </div>

                {/* Last Service Date */}
                <div className="space-y-2">
                  <label
                    htmlFor="last_service_date"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Last Service Date
                  </label>
                  <input
                    type="date"
                    id="last_service_date"
                    name="last_service_date"
                    value={formData.last_service_date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Financial Valuation & Depreciation Section */}
            <div className="bg-slate-50/80 p-5 rounded-xl border border-slate-200 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                <div>
                  <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                    <i className="fa-solid fa-coins text-indigo-600"></i> Financial Valuation & Depreciation
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Asset purchase cost, current carrying book value, and accrued depreciation</p>
                </div>
                <button
                  type="button"
                  onClick={calculateDepreciation}
                  className="self-start sm:self-auto text-xs font-semibold px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition border border-indigo-200 flex items-center gap-1.5 shadow-sm"
                  title="Calculate Accumulated Depreciation as Gross Cost - Book Value"
                >
                  <i className="fa-solid fa-calculator"></i> Auto-Calculate
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Gross Cost */}
                <div className="space-y-2">
                  <label
                    htmlFor="gross_cost"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Gross Cost (₹)
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-gray-500 font-medium sm:text-sm">₹</span>
                    </div>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      id="gross_cost"
                      name="gross_cost"
                      value={formData.gross_cost}
                      onChange={handleInputChange}
                      className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition bg-white"
                      placeholder="e.g. 1850000"
                    />
                  </div>
                </div>

                {/* Book Value */}
                <div className="space-y-2">
                  <label
                    htmlFor="book_value"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Book Value (₹)
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-gray-500 font-medium sm:text-sm">₹</span>
                    </div>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      id="book_value"
                      name="book_value"
                      value={formData.book_value}
                      onChange={handleInputChange}
                      className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition bg-white"
                      placeholder="e.g. 1110000"
                    />
                  </div>
                </div>

                {/* Accumulated Depreciation */}
                <div className="space-y-2">
                  <label
                    htmlFor="accumulated_depreciation"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Accumulated Depreciation (₹)
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-gray-500 font-medium sm:text-sm">₹</span>
                    </div>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      id="accumulated_depreciation"
                      name="accumulated_depreciation"
                      value={formData.accumulated_depreciation}
                      onChange={handleInputChange}
                      className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition bg-white"
                      placeholder="e.g. 740000"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Maintenance Tasks Section */}
              <div className="mb-6">
                <label
                  htmlFor="maintenance"
                  className="block text-sm sm:text-base font-medium text-gray-700 mb-2"
                >
                  Maintenance Tasks
                </label>

                <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0 mb-4">
                  <input
                    type="text"
                    id="maintenance"
                    value={newMaintenance}
                    onChange={(e) => setNewMaintenance(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addMaintenance();
                      }
                    }}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition w-full"
                    placeholder="Enter maintenance task"
                  />
                  <button
                    onClick={addMaintenance}
                    type="button"
                    className="w-full sm:w-auto px-5 py-2.5 primary-bgclr hover:bg-blue-600 text-white font-medium rounded-lg transition flex items-center justify-center"
                    style={{ backgroundColor: "#574fdd" }}
                  >
                    <span className="mr-2">+</span>Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {maintenance.map((task, index) => (
                    <div
                      key={index}
                      className="flex items-center px-3 py-2 bg-white border border-gray-200 rounded-lg transition-all duration-200 hover:shadow-md w-full sm:w-auto"
                    >
                      <span className="flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full mr-2">
                        {index + 1}
                      </span>
                      <span className="text-gray-700 flex-1">{task}</span>
                      <button
                        onClick={() => removeMaintenance(index)}
                        className="text-red-500 hover:text-red-600 transition-colors ml-2"
                        type="button"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                {errors.maintenance && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.maintenance}
                  </p>
                )}
              </div>

              {/* Additional Fields Section */}
              <div className="mb-8">
                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                  Additional Fields
                </label>

                <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0 mb-4">
                  <input
                    type="text"
                    value={newField.key}
                    onChange={(e) =>
                      setNewField((prev) => ({ ...prev, key: e.target.value }))
                    }
                    className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition w-full"
                    placeholder="Enter field key"
                  />
                  <input
                    type="text"
                    value={newField.value}
                    onChange={(e) =>
                      setNewField((prev) => ({
                        ...prev,
                        value: e.target.value,
                      }))
                    }
                    className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition w-full"
                    placeholder="Enter field value"
                  />
                  <button
                    onClick={addAdditionalField}
                    type="button"
                    className="w-full sm:w-auto px-5 py-2.5 primary-bgclr hover:bg-blue-600 text-white font-medium rounded-lg transition flex items-center justify-center"
                    style={{ backgroundColor: "#574fdd" }}
                  >
                    <span className="mr-2">+</span>Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {additionalFields.map((field, index) => (
                    <div
                      key={index}
                      className="flex items-center px-3 py-2 bg-white border border-gray-200 rounded-lg transition-all duration-200 hover:shadow-md w-full sm:w-auto"
                    >
                      <span className="flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full mr-2">
                        {index + 1}
                      </span>
                      <span className="text-gray-700 flex-1">
                        {field.key}: {field.value}
                      </span>
                      <button
                        onClick={() => removeAdditionalField(index)}
                        className="text-red-500 hover:text-red-600 transition-colors ml-2"
                        type="button"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              {machineId ? (
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

export default MachineForm;