import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { axiosInstance, backendUrl } from "../../../utils/url/config";
import { useLoader } from "../../../context/LoaderContext";
import { toast } from "react-toastify";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
import { FormControl, Select, MenuItem, Checkbox, FormControlLabel } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { getAllDepartments } from "../../../reducer/departmentReducer";
import { fetchAllMachines } from "../../../reducer/machineReducer";
import { fetchAllUnits } from "../../../reducer/unitReducer";
import { fetchAllProcessColumns } from "../../../reducer/processColumnReducer";
import { useCallback } from "react";
import { getProcessById, createProcess, updateProcess, checkServiceCategoryExists, clearServiceCategoryCheck } from "../../../reducer/processReducer";
import { fetchAllVendors } from "../../../reducer/vendorReducer";
import { fetchAllServiceCategories } from "../../../reducer/serviceCategoryReducer";

const ProcessForm = () => {
  const { processId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showLoader, hideLoader } = useLoader();

  const [formData, setFormData] = useState({
    serviceCategory: "",
    type: "",
    is_active: null,
    rate_parameter: "",
    has_custom_input: false,
  });

  const [columns, setColumns] = useState([]);
  const [columnName, setColumnName] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // const [departments, setDepartments] = useState([]);
  // const [machines, setMachines] = useState([]);
  // const [units, setUnits] = useState([]);

  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedMachines, setSelectedMachines] = useState([]);
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [selectedUnitTypes, setSelectedUnitTypes] = useState([]);
  const [selectedVendors, setSelectedVendors] = useState([]);

  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedMachine, setSelectedMachine] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedUnitType, setSelectedUnitType] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("");

  const unitTypeOptions = [
    "Size (Length/Dimension)",
    "Size (Area)",
    "Size (Volume/Capacity)",
    "Weight (Mass)",
    "Time",
    "Quantity"
  ];

  // Variables state
  const [variables, setVariables] = useState([]);
  const [newVariable, setNewVariable] = useState({
    key: "",
    label: "",
    allowed_values: [],
    is_rate_variable: false,
    is_size_variable: false,
  });
  const [newAllowedValue, setNewAllowedValue] = useState("");

  const { departments, filters } = useSelector(state => state.department);
  const { units } = useSelector(state => state.unit);
  const { machines } = useSelector(state => state.machine);
  const { processColumns } = useSelector(state => state.processColumn);
  const { singleProcess } = useSelector(state => state.process);
  const { vendors } = useSelector(state => state.vendor);
  const { serviceCategory } = useSelector(state => state.serviceCategory);
  const { serviceCategoryCheck } = useSelector((state) => state.process);

  const fetchServiceCategory = useCallback(async () => {
    try {
      await dispatch(fetchAllServiceCategories({ is_active: true }));
    } catch {
      toast.error("Failed to load process columns");
    }
  }, [dispatch])

  const fetchVendors = useCallback(async (serviceCategory) => {
    try {
      await dispatch(fetchAllVendors({ is_active: true, service_category: serviceCategory }));
    } catch {
      toast.error("Failed to load process columns");
    }
  }, [dispatch])

  const fetchColumns = useCallback(async () => {
    try {
      await dispatch(fetchAllProcessColumns({ is_active: true }));
    } catch {
      toast.error("Failed to load process columns");
    }
  }, [dispatch]);

  const fetchDepartmentDropdown = useCallback(async (type) => {
    try {
      await dispatch(getAllDepartments({ is_active: true, params: { type: type === "Both" ? '' : type } }));
    } catch {
      toast.error("Failed to load process columns");
    }
  }, [dispatch])

  const fetchMachineDropdown = useCallback(async (deparment) => {
    try {
      const departmentName = deparment.join(',')
      await dispatch(fetchAllMachines({ is_active: true, departmentname: departmentName }));
    } catch {
      toast.error("Failed to load process columns");
    }
  }, [dispatch])

  const fetchUnits = useCallback(async (unitTypes) => {
    try {
      await dispatch(fetchAllUnits({ is_active: true, category: unitTypes.join(',') }));
    } catch {
      toast.error("Failed to load process columns");
    }
  }, [dispatch])

  const handleServiceCategoryChange = useCallback(async (serviceCategoryId) => {
    if (serviceCategoryId) {
      await dispatch(checkServiceCategoryExists(serviceCategoryId));
    }
  }, [dispatch]);

  // Fetch columns
  useEffect(() => {
    fetchColumns();
    fetchServiceCategory();
  }, [fetchServiceCategory, fetchColumns, processId]);

  useEffect(() => {
    if (formData.serviceCategory) {
      fetchVendors(formData.serviceCategory);
      if (!processId) {
        handleServiceCategoryChange(formData.serviceCategory)
      }
    };
  }, [fetchVendors, formData.serviceCategory, processId, handleServiceCategoryChange])

  useEffect(() => {
    if (!formData.type) return;
    fetchDepartmentDropdown(formData.type)
  }, [fetchDepartmentDropdown, formData.type])

  useEffect(() => {
    if (selectedDepartments.length === 0) return;
    fetchMachineDropdown(selectedDepartments)
  }, [fetchMachineDropdown, selectedDepartments])

  useEffect(() => {
    if (selectedUnitTypes.length === 0) return;
    fetchUnits(selectedUnitTypes)
  }, [fetchUnits, selectedUnitTypes])

  // Fetch process data for edit
  const fetchProcess = useCallback(async () => {
    showLoader();
    try {
      await dispatch(getProcessById(processId));
    } catch {
      toast.error("Failed to load process data");
    } finally {
      hideLoader();
    }
  }, [dispatch, processId, showLoader, hideLoader]);

  useEffect(() => {
    if (!processId) return;
    fetchProcess();
  }, [fetchProcess, processId]);

  useEffect(() => {
    const loadProcessData = async () => {
      if (!singleProcess || !processId) return;


      const processType = singleProcess.type || "";
      const serviceCatId = singleProcess.service_category._id;
      const deptIds = singleProcess.department?.map(dept => dept._id) || [];
      const unitTypes = singleProcess.unit_type || [];

      showLoader();
      try {
        // Fetch all dropdown data in sequence
        await fetchVendors(serviceCatId);
        await fetchDepartmentDropdown(processType);

        if (deptIds.length > 0) {
          await fetchMachineDropdown(deptIds);
        }

        if (unitTypes.length > 0) {
          await fetchUnits(unitTypes);
        }

        // Small delay to ensure Redux state is updated
        await new Promise(resolve => setTimeout(resolve, 100));

        // Now set the selected values
        setFormData({
          serviceCategory: serviceCatId,
          type: processType,
          is_active: singleProcess.is_active ?? null,
          rate_parameter: singleProcess.rate_parameter || "",
          has_custom_input: singleProcess.has_custom_input,
        });

        setColumns(singleProcess.additional_columns?.map(col => col._id || col) || []);
        setSelectedDepartments(singleProcess.department?.map(dept => dept._id) || []);
        setSelectedMachines(singleProcess.machine?.map(mach => mach._id) || []);
        setSelectedUnits(singleProcess.unit?.map(u => u._id || u) || []);
        setSelectedUnitTypes(unitTypes);
        setSelectedVendors(singleProcess.available_vendors.map(v => v._id) || []);
        setVariables(singleProcess.variables || []);

      } catch (error) {
        console.error("Error loading process data:", error);
        toast.error("Failed to load process data");
      } finally {
        hideLoader();
      }
    };

    loadProcessData();
  }, [processId, singleProcess, fetchDepartmentDropdown, fetchMachineDropdown, fetchUnits, fetchVendors, showLoader, hideLoader]);

  // Clear check when component unmounts or form resets
  useEffect(() => {
    return () => {
      dispatch(clearServiceCategoryCheck());
    };
  }, [dispatch]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleNewVariableChange = (field, value) => {
    setNewVariable((prev) => ({ ...prev, [field]: value }));
  };

  const addAllowedValue = () => {
    if (!newAllowedValue.trim()) return toast.error("Enter a value");
    const capitalizedValue = newAllowedValue.charAt(0).toUpperCase() + newAllowedValue.slice(1);
    if (newVariable.allowed_values.includes(capitalizedValue.trim())) {
      return toast.error("Value already exists");
    }
    setNewVariable((prev) => ({
      ...prev,
      allowed_values: [...prev.allowed_values, capitalizedValue.trim()],
    }));
    setNewAllowedValue("");
  };

  const removeAllowedValue = (index) => {
    setNewVariable((prev) => ({
      ...prev,
      allowed_values: prev.allowed_values.filter((_, i) => i !== index),
    }));
  };

  const addVariable = () => {
    if (!newVariable.key.trim()) return toast.error("Variable key is required");
    if (!newVariable.label.trim()) return toast.error("Variable label is required");
    if (newVariable.allowed_values.length === 0 && newVariable.is_rate_variable) {
      return toast.error("At least one allowed value is required");
    }

    // Check for duplicate key
    if (variables.some((v) => v.key.toLowerCase() === newVariable.key.toLowerCase())) {
      return toast.error("Variable key already exists");
    }

    setVariables((prev) => [...prev, { ...newVariable }]);
    setNewVariable({
      key: "",
      label: "",
      allowed_values: [],
      is_rate_variable: false,
      is_size_variable: false,
    });
  };

  const removeVariable = (index) => {
    setVariables((prev) => prev.filter((_, i) => i !== index));
  };

  const addItem = (item, list, setList, setSelected) => {
    if (!item) return toast.error("Select a value to add");
    if (list.includes(item)) return toast.error("Already added");
    setList([...list, item]);
    setSelected("");
  };

  const removeItem = (index, list, setList) => {
    setList(list.filter((_, i) => i !== index));
  };

  const addUnitType = () => {
    if (!selectedUnitType) return toast.error("Select a unit type to add");
    if (selectedUnitTypes.includes(selectedUnitType)) {
      return toast.error("Already added");
    }
    setSelectedUnitTypes(prev => [...prev, selectedUnitType]);
    setSelectedUnitType("");
  };

  const removeUnitType = (index) => {
    setSelectedUnitTypes(prev => prev.filter((_, i) => i !== index));
  };

  // Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.serviceCategory.trim()) newErrors.serviceCategory = "service cateogry is required";
    if (!formData.type) newErrors.type = "Process Type is required";
    if (formData.is_active === null) newErrors.is_active = "Status is required";

    if (selectedDepartments.length === 0)
      newErrors.departments = "At least one department is required";
    if (selectedUnits.length === 0 && formData.has_custom_input)
      newErrors.units = "At least one unit is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return toast.error("Please fix validation errors");

    const payload = {
      service_category: formData.serviceCategory,
      type: formData.type,
      is_active: formData.is_active,
      rate_parameter: formData.rate_parameter,
      has_custom_input: formData.has_custom_input,
      unit_type: selectedUnitTypes,
      department: selectedDepartments,
      machine: selectedMachines,
      available_vendors: selectedVendors,
      unit: selectedUnits,
      additional_columns: columns,
      variables: variables,
    };

    setIsLoading(true);
    showLoader();
    try {
      let result;

      if (processId) {
        result = await dispatch(updateProcess({ id: processId, formData: payload }));
      } else {
        result = await dispatch(createProcess(payload));
      }

      // Check if the action was successful
      if (result.type.endsWith('/fulfilled')) {
        toast.success(processId ? "Process updated successfully" : "Process created successfully");
        navigate("/process");
      } else {
        // Action was rejected
        const errorMessage = result.payload?.message || result.error?.message || "Failed to submit process data";
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error(error?.message || "Failed to submit process data");
    } finally {
      setIsLoading(false);
      hideLoader();
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      type: "",
      is_active: null,
      rate_parameter: "",
      has_custom_input: false,
    });

    setColumns([]);
    setSelectedDepartments([]);
    setSelectedMachines([]);
    setSelectedUnits([]);
    setSelectedUnitTypes([])
    setVariables([]);

    setSelectedDepartment("");
    setSelectedMachine("");
    setSelectedUnit("");
    setSelectedUnitType("");
    setColumnName("");

    setNewVariable({
      key: "",
      label: "",
      allowed_values: [],
      is_rate_variable: false,
      is_size_variable: false,
    });

    setErrors({});
  };

  const renderDropdownAddRow = (
    label,
    list,
    setList,
    options,
    selectedValue,
    setSelected,
    dataEmptyError,
    required = true
  ) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex gap-2 mb-2">
        <Select
          value={selectedValue}
          onChange={(e) => setSelected(e.target.value)}
          displayEmpty
          className="flex-1"
        >
          <MenuItem value="">
            {options.length === 0 ? (
              <span className="text-gray-500 text-sm">{dataEmptyError}</span>
            ) : (<span className="text-gray-400">Select {label.toLowerCase()}</span>)}
          </MenuItem>
          {options.length > 0 && options
            .filter((o) => !list.includes(o._id))
            .map((opt) => (
              <MenuItem key={opt._id} value={opt._id}>
                {label === "Vendors" ? `${opt?.name} - ${opt?.service_category.name} - ${opt?.contract_type.name}` :
                  `${opt?.name} ${opt?.type ? `- ${opt?.type}` : ""}`}
              </MenuItem>
            ))}
        </Select>

        <button
          onClick={() => addItem(selectedValue, list, setList, setSelected)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
          disabled={options.length === 0}
        >
          + Add
        </button>
      </div>

      {errors[label.toLowerCase()] && (
        <p className="text-red-600 text-sm">{errors[label.toLowerCase()]}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {list.length > 0 && list.map((item, index) => {
          const opt = options.find((o) => o._id === item);
          return (
            <div
              key={item}
              className="flex items-center gap-2 px-3 py-1 bg-gray-100 border rounded-lg"
            >
              <span>{label === "Vendors" ? `${opt?.name} - ${opt?.service_category.name} - ${opt?.contract_type.name}` : opt?.name}</span>
              <button
                onClick={() => removeItem(index, list, setList)}
                className="text-red-500"
              >
                &times;
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="bg-gray-100 min-h-screen pt-20">
      <div className="flex justify-center p-4">
        <div className="w-full max-w-6xl bg-white rounded-xl shadow border border-gray-200">
          <div className="border-b p-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">
              {processId ? "Edit Process" : "Create Process"}
            </h1>
            <button onClick={() => navigate(-1)} className="text-blue-600">
              <KeyboardBackspaceIcon />
            </button>
          </div>

          <div className="p-6 space-y-6">

            {/* Duplicate Warning Alert */}
            {serviceCategoryCheck?.exists === true && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-red-600 font-semibold">⚠️ Service category already exists </span>
                </div>
              </div>
            )}

            {/* Process Basic Fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Process Name <span className="text-red-500">*</span>
                </label>
                {/* <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded-lg"
                /> */}
                <Select
                  name="serviceCategory"
                  value={formData.serviceCategory ?? ""}
                  onChange={handleInputChange}
                  displayEmpty
                  className="w-full"
                  disabled={processId}
                >
                  <MenuItem value="">
                    <span className="text-gray-400">Select Service Category</span>
                  </MenuItem>
                  {serviceCategory.map((item) => (
                    <MenuItem key={item._id} value={item._id}>
                      {item.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.name && (
                  <span className="text-red-500 text-sm">{errors.name}</span>
                )}
                {processId && (
                  <span className="text-xs text-gray-500 mt-1 block">
                    Service Category cannot be changed while editing
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <Select
                  name="is_active"
                  value={formData.is_active ?? ""}
                  onChange={handleInputChange}
                  displayEmpty
                  className="w-full"
                >
                  <MenuItem value="">
                    <span className="text-gray-400">Select status</span>
                  </MenuItem>
                  <MenuItem value={true}>Active</MenuItem>
                  <MenuItem value={false}>Inactive</MenuItem>
                </Select>
                {errors.is_active && (
                  <span className="text-red-500 text-sm">{errors.is_active}</span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Process Type <span className="text-red-500">*</span>
                </label>
                <Select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  displayEmpty
                  className="w-full"
                >
                  <MenuItem value="">
                    <span className="text-gray-400">Select type</span>
                  </MenuItem>
                  <MenuItem value="In House">In House</MenuItem>
                  <MenuItem value="Out Source">Out Source</MenuItem>
                  <MenuItem value="Both">Both</MenuItem>
                </Select>
                {errors.type && (
                  <span className="text-red-500 text-sm">{errors.type}</span>
                )}
              </div>

              {/* <div>
                <label className="block text-sm font-medium mb-1">
                  Rate Parameter
                </label>
                <input
                  type="text"
                  name="rate_parameter"
                  value={formData.rate_parameter}
                  onChange={handleInputChange}
                  placeholder="e.g., per min, per sq ft"
                  className="w-full border px-3 py-2 rounded-lg"
                />
              </div> */}

              {/* Dropdown Sections */}
              {formData.type &&
                <>
                  {
                    renderDropdownAddRow(
                      "Departments",
                      selectedDepartments,
                      setSelectedDepartments,
                      departments,
                      selectedDepartment,
                      setSelectedDepartment,
                      "No Department Found"
                    )}
                  {selectedDepartments && (
                    <>
                      {renderDropdownAddRow(
                        "Machines",
                        selectedMachines,
                        setSelectedMachines,
                        machines,
                        selectedMachine,
                        setSelectedMachine,
                        "No Machines Found"
                      )}
                    </>
                  )}
                </>
              }

              {formData.serviceCategory && vendors && renderDropdownAddRow(
                "Vendors",
                selectedVendors,
                setSelectedVendors,
                vendors,
                selectedVendor,
                setSelectedVendor,
                "No Vendor Found"
              )}

              {/* {renderDropdownAddRow(
                "Additional Columns",
                columns,
                setColumns,
                processColumns,
                columnName,
                setColumnName,
                "No Additional Column Found",
                false
              )} */}

              <div className="flex flex-col">
                <FormControlLabel
                  control={
                    <Checkbox
                      name="has_custom_input"
                      checked={formData.has_custom_input}
                      onChange={handleInputChange}
                    />
                  }
                  label="Requires Custom Input"
                />
                <span className="text-xs text-gray-500">
                  Enable if user needs to provide a value like dimensions, piece count, or time for this process.
                </span>
              </div>

              {formData.has_custom_input && (
                <>
                  {/* <div>
                    <label className="block text-sm font-medium mb-1">
                      Unit Type
                    </label>
                    <input
                      type="text"
                      name="unit_type"
                      value={formData.unit_type}
                      onChange={handleInputChange}
                      placeholder="e.g., area, length"
                      className="w-full border px-3 py-2 rounded-lg"
                    />
                  </div> */}

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Type <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2 mb-2">
                      <Select
                        value={selectedUnitType}
                        onChange={(e) => setSelectedUnitType(e.target.value)}
                        displayEmpty
                        className="flex-1"
                      >
                        <MenuItem value="">
                          {unitTypeOptions.filter(opt => !selectedUnitTypes.includes(opt)).length === 0 ? (
                            <span className="text-gray-500 text-sm">No Unit Type Available</span>
                          ) : (
                            <span className="text-gray-400">Select unit type</span>
                          )}
                        </MenuItem>
                        {unitTypeOptions
                          .filter(opt => !selectedUnitTypes.includes(opt))
                          .map((opt) => (
                            <MenuItem key={opt} value={opt}>
                              {opt}
                            </MenuItem>
                          ))}
                      </Select>

                      <button
                        onClick={addUnitType}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md"
                        disabled={unitTypeOptions.filter(opt => !selectedUnitTypes.includes(opt)).length === 0}
                      >
                        + Add
                      </button>
                    </div>

                    {errors.selectedUnitType && (
                      <p className="text-red-600 text-sm">{errors.selectedUnitType}</p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {selectedUnitTypes.map((item, index) => (
                        <div
                          key={item}
                          className="flex items-center gap-2 px-3 py-1 bg-gray-100 border rounded-lg"
                        >
                          <span>{item}</span>
                          <button
                            onClick={() => removeUnitType(index)}
                            className="text-red-500"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedUnitTypes.length > 0 && (renderDropdownAddRow(
                    "Units",
                    selectedUnits,
                    setSelectedUnits,
                    units,
                    selectedUnit,
                    setSelectedUnit,
                    "No Units Found"
                  ))}
                </>
              )}
            </div>

            {/* Variables Section */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">Process Variables</h2>

              {/* Add New Variable Form */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Variable Key
                    </label>
                    <input
                      type="text"
                      value={newVariable.key}
                      onChange={(e) =>
                        handleNewVariableChange("key", e.target.value.toLowerCase().replace(/\s+/g, "_"))
                      }
                      placeholder="e.g., material"
                      className="w-full border px-3 py-2 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Variable Label
                    </label>
                    <input
                      type="text"
                      value={newVariable.label}
                      onChange={(e) =>
                        handleNewVariableChange("label", e.target.value)
                      }
                      placeholder="e.g., Material"
                      className="w-full border px-3 py-2 rounded-lg"
                    />
                  </div>
                </div>

                {/* Allowed Values */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Allowed Values
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newAllowedValue}
                      onChange={(e) => setNewAllowedValue(e.target.value)}
                      placeholder="Enter allowed value"
                      className="flex-1 border px-3 py-2 rounded-lg"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addAllowedValue();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={addAllowedValue}
                      className="px-4 py-2 bg-green-600 text-white rounded-md"
                    >
                      + Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {newVariable.allowed_values.map((val, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-3 py-1 bg-white border rounded-lg"
                      >
                        <span>{val}</span>
                        <button
                          onClick={() => removeAllowedValue(index)}
                          className="text-red-500"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Variable Options */}
                <div className="flex gap-4 mb-4">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={newVariable.is_rate_variable}
                        onChange={(e) =>
                          handleNewVariableChange("is_rate_variable", e.target.checked)
                        }
                      />
                    }
                    label="Is Rate Variable"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={newVariable.is_size_variable}
                        onChange={(e) =>
                          handleNewVariableChange("is_size_variable", e.target.checked)
                        }
                      />
                    }
                    label="Is Size Variable"
                  />
                </div>

                <button
                  type="button"
                  onClick={addVariable}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md"
                >
                  + Add Variable
                </button>
              </div>

              {/* Display Added Variables */}
              {variables.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-700">Added Variables:</h3>
                  {variables.map((variable, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-3 bg-gray-50 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">
                          {variable.label}{" "}
                          <span className="text-gray-500 text-sm">
                            ({variable.key})
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Values: {variable.allowed_values.join(", ")}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {variable.is_rate_variable && (
                            <span className="mr-2 px-2 py-0.5 bg-blue-100 rounded">
                              Rate Variable
                            </span>
                          )}
                          {variable.is_size_variable && (
                            <span className="px-2 py-0.5 bg-green-100 rounded">
                              Size Variable
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeVariable(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t flex justify-end gap-2">
              <button
                onClick={handleReset}
                className="px-5 py-2.5 bg-white border border-red-500 text-red-500 hover:bg-red-50 font-medium rounded-lg transition"
                type="button"
                disabled={isLoading}
              >
                Reset
              </button>

              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded-md"
              >
                {isLoading ? "Saving..." : processId ? "Update" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessForm;
