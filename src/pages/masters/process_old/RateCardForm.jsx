import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { axiosInstance } from "../../../utils/url/config";
import { useLoader } from "../../../context/LoaderContext";
import { toast } from "react-toastify";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
import { FormControl, Select, MenuItem, Checkbox, FormControlLabel } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { getAllProcesses } from "../../../reducer/processReducer";
import {
  getRateCardById,
  createRateCard,
  updateRateCard,
  clearSingleRateCard,
  checkRateCardExists,
} from "../../../reducer/rateCardReducer";
import { getProcessById } from "../../../reducer/processReducer";

const RateCardForm = () => {
  const { rateCardId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showLoader, hideLoader } = useLoader();

  const [formData, setFormData] = useState({
    process_id: "",
    rate_unit: "",
    is_internal: false,
    vendor: "",
    is_active: null,
    remarks: "",
  });

  const [variableRates, setVariableRates] = useState([]);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const { processes } = useSelector((state) => state.process);
  const { singleRateCard } = useSelector((state) => state.rateCard);
  const { singleProcess } = useSelector((state) => state.process);

  // Fetch all processes
  const fetchProcesses = useCallback(async () => {
    try {
      await dispatch(getAllProcesses({ is_active: true, order: "asc", params: {} }));
    } catch (error) {
      toast.error("Failed to fetch processes");
    }
  }, [dispatch]);

  useEffect(() => {
    fetchProcesses();
  }, [fetchProcesses]);

  // Fetch rate card data for edit
  const fetchRateCard = useCallback(async () => {
    if (!rateCardId) return;

    showLoader();
    try {
      await dispatch(getRateCardById(rateCardId));
    } catch (error) {
      toast.error("Failed to load rate card data");
    } finally {
      hideLoader();
    }
  }, [rateCardId, dispatch, showLoader, hideLoader]);

  useEffect(() => {
    if (!rateCardId) return;
    fetchRateCard();
  }, [fetchRateCard, rateCardId]);

  // Populate form when singleRateCard is loaded
  useEffect(() => {
    if (singleRateCard && rateCardId) {
      setFormData({
        process_id: singleRateCard.process_id?._id || singleRateCard.process_id || "",
        rate_unit: singleRateCard.rate_unit || "",
        is_internal: singleRateCard.is_internal || false,
        vendor: singleRateCard.vendor?._id || singleRateCard.vendor || "",
        is_active: singleRateCard.is_active ?? null,
        remarks: singleRateCard.remarks || "",
      });

      // Fetch process details - FIXED: Use _id or id correctly
      if (singleRateCard.process_id) {
        const processId = singleRateCard.process_id.id || singleRateCard.process_id;
        dispatch(getProcessById(processId));
      }
      setVariableRates(singleRateCard.variable_rates || []);
    }
  }, [singleRateCard, rateCardId, dispatch]);

  // Set selected process when singleProcess is loaded
  useEffect(() => {
    if (singleProcess) {
      setSelectedProcess(singleProcess);
    }
  }, [singleProcess]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispatch(clearSingleRateCard());
    };
  }, [dispatch]);

  // Check for duplicate rate card
  const checkDuplicateRateCard = async (processId, isInternal, vendorId) => {
    // Skip validation in edit mode
    if (rateCardId) return true;

    try {
      const result = await dispatch(checkRateCardExists({
        process_id: processId,
        is_internal: isInternal,
        vendor: vendorId
      })).unwrap();

      if (result.success && result.exists) {
        const errorMessage = isInternal
          ? 'Internal rate card already exists for this process'
          : 'Rate card already exists for this process and vendor combination';

        setErrors((prev) => ({
          ...prev,
          duplicate: errorMessage,
        }));
        return false;
      } else {
        setErrors((prev) => ({
          ...prev,
          duplicate: '',
        }));
        return true;
      }
    } catch (error) {
      console.error('Error checking duplicate:', error);
      // On error, allow creation
      setErrors((prev) => ({
        ...prev,
        duplicate: '',
      }));
      return true;
    }
  };

  // Handle process selection and auto-populate variable rates
  const handleProcessChange = async (e) => {
    const processId = e.target.value;

    const selectedProc = processes.find(item => item._id === processId);

    // if not found, clear and return safely
    if (!selectedProc) {
      setFormData((prev) => ({ ...prev, process_id: "", vendor: "" }));
      setSelectedProcess(null);
      setVariableRates([]);
      return;
    }

    setFormData((prev) => ({ ...prev, process_id: selectedProc._id, vendor: "" }));
    setErrors((prev) => ({ ...prev, process_id: "", vendor: "", duplicate: "" }));

    try {
      showLoader();
      // Use the correct ID field
      const idToFetch = selectedProc.id || selectedProc._id;
      await dispatch(getProcessById(idToFetch));
    } catch (error) {
      toast.error("Failed to fetch process details");
    } finally {
      hideLoader();
    }
  };

  // Auto-populate variable rates when process is selected
  useEffect(() => {
    if (!singleProcess || !formData.process_id) return;

    const process = singleProcess;
    setSelectedProcess(process);

    // Auto-populate variable rates from process rate variables
    const rateVariables = process.variables?.filter(
      (v) => v.is_rate_variable
    ) || [];

    if (rateVariables.length > 0) {
      // Create variable rates for each combination of allowed values
      const createCombinations = (arrays) => {
        if (arrays.length === 0) return [{}];

        return arrays.reduce((acc, curr) => {
          const result = [];
          acc.forEach(accItem => {
            curr.allowed_values.forEach(value => {
              result.push({
                ...accItem,
                [curr.key]: value
              });
            });
          });
          return result;
        }, [{}]);
      };

      const combinations = createCombinations(rateVariables);

      // Get existing variable rates if editing
      const existingRates = rateCardId && singleRateCard?.variable_rates ? singleRateCard.variable_rates : [];

      const newVariableRates = combinations.map(combo => {
        // Find matching existing rate based on all rate variable keys
        const matchingRate = existingRates.find(existingRate => {
          return rateVariables.every(variable => {
            return existingRate[variable.key] === combo[variable.key];
          });
        });

        return {
          ...combo,
          price: matchingRate ? matchingRate.price : 0,
        };
      });

      setVariableRates(newVariableRates);
    } else {
      setVariableRates([]);
      toast.info("This process has no rate variables defined");
    }
  }, [singleProcess, formData.process_id, rateCardId, singleRateCard]);

  const handleInputChange = async (e) => {
    const { name, value, type, checked } = e.target;

    // Prevent changes to immutable fields in edit mode
    if (rateCardId && ['process_id', 'is_internal', 'vendor'].includes(name)) {
      toast.warning(`Cannot change ${name.replace('_', ' ')} in edit mode`);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "", duplicate: "" }));

    // Clear vendor when is_internal is checked
    if (name === "is_internal" && checked) {
      setFormData((prev) => ({ ...prev, vendor: "" }));
      setErrors((prev) => ({ ...prev, vendor: "", duplicate: "" }));

      // Check for duplicate internal rate card
      if (formData.process_id) {
        await checkDuplicateRateCard(formData.process_id, true, null);
      }
    }

    // If unchecking is_internal, clear duplicate error
    if (name === "is_internal" && !checked) {
      setErrors((prev) => ({ ...prev, duplicate: "" }));
    }
  };

  const handleVendorChange = async (e) => {
    const vendorId = e.target.value;

    // Prevent changes in edit mode
    if (rateCardId) {
      toast.warning('Cannot change vendor in edit mode');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      vendor: vendorId,
    }));

    setErrors((prev) => ({ ...prev, vendor: "", duplicate: "" }));

    console.log("vendorId && formData.process_id && !formData.is_internal", vendorId, formData.process_id, formData.is_internal)

    // Check for duplicate rate card with this vendor
    if (vendorId && formData.process_id && !formData.is_internal) {
      await checkDuplicateRateCard(formData.process_id, false, vendorId);
    }
  };

  const handleVariableRateChange = (index, field, value) => {
    setVariableRates((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: field === "price" ? parseFloat(value) || 0 : value,
      };
      return updated;
    });
  };

  const addVariableRate = () => {
    if (!selectedProcess) {
      return toast.error("Please select a process first");
    }

    const rateVariables = selectedProcess.variables?.filter(
      (v) => v.is_rate_variable
    ) || [];

    if (rateVariables.length === 0) {
      return toast.error("Selected process has no rate variables");
    }

    const newRate = {};
    rateVariables.forEach((variable) => {
      newRate[variable.key] = variable.allowed_values[0] || "";
    });
    newRate.price = 0;

    setVariableRates((prev) => [...prev, newRate]);
  };

  const removeVariableRate = (index) => {
    setVariableRates((prev) => prev.filter((_, i) => i !== index));
  };

  // Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.process_id) newErrors.process_id = "Process is required";
    if (!formData.is_internal && !formData.vendor) {
      newErrors.vendor = "Vendor is required when not internal";
    }
    if (formData.is_active === null) newErrors.is_active = "Status is required";

    if (variableRates.length === 0) {
      newErrors.variableRates = "At least one variable rate is required";
    } else {
      // Validate each variable rate
      const hasInvalidRate = variableRates.some((rate) => {
        return rate.price <= 0;
      });

      if (hasInvalidRate) {
        newErrors.variableRates = "All variable rates must have a price greater than 0";
      }
    }

    // Check for duplicate error
    if (errors.duplicate) {
      newErrors.duplicate = errors.duplicate;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return toast.error("Please fix validation errors");

    // Final duplicate check before submission (only in create mode)
    if (!rateCardId) {
      const isDuplicateValid = await checkDuplicateRateCard(
        formData.process_id,
        formData.is_internal,
        formData.is_internal ? null : formData.vendor
      );

      if (!isDuplicateValid) {
        return;
      }
    }

    const payload = {
      process_id: formData.process_id,
      rate_unit: formData.rate_unit,
      is_internal: formData.is_internal,
      is_active: formData.is_active,
      remarks: formData.remarks,
      variable_rates: variableRates,
    };

    // Only add vendor if not internal
    if (!formData.is_internal && formData.vendor) {
      payload.vendor = formData.vendor;
    }

    //if internal is true need to remove vendor
    if (formData.is_internal) {
      payload.vendor = null;
    }

    // Remove immutable fields when updating
    if (rateCardId) {
      delete payload.process_id;
      delete payload.is_internal;
      delete payload.vendor;
    }

    console.log('payload', payload)

    setIsLoading(true);
    showLoader();
    try {
      if (rateCardId) {
        await dispatch(updateRateCard({ id: rateCardId, formData: payload })).unwrap();
        toast.success("Rate card updated successfully");
      } else {
        await dispatch(createRateCard(payload)).unwrap();
        toast.success("Rate card created successfully");
      }
      navigate("/ratecard");
    } catch (error) {
      const errorMessage = error?.message || "Failed to submit rate card data";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      hideLoader();
    }
  };

  const handleReset = () => {
    setFormData({
      process_id: "",
      rate_unit: "",
      is_internal: false,
      vendor: "",
      is_active: null,
      remarks: "",
    });
    setVariableRates([]);
    setSelectedProcess(null);
    setErrors({});
  };

  const getRateVariableLabel = (key) => {
    if (!selectedProcess) return key;
    const variable = selectedProcess.variables?.find((v) => v.key === key);
    return variable?.label || key;
  };

  const getRateVariableOptions = (key) => {
    if (!selectedProcess) return [];
    const variable = selectedProcess.variables?.find((v) => v.key === key);
    return variable?.allowed_values || [];
  };

  // Get vendor list from selected process
  const getVendorList = () => {
    if (!selectedProcess || !selectedProcess.available_vendors) return [];
    return selectedProcess.available_vendors;
  };

  return (
    <div className="bg-gray-100 min-h-screen pt-20">
      <div className="flex justify-center p-4">
        <div className="w-full max-w-6xl bg-white rounded-xl shadow border border-gray-200">
          <div className="border-b p-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">
              {rateCardId ? "Edit Rate Card" : "Create Rate Card"}
            </h1>
            <button onClick={() => navigate(-1)} className="text-blue-600">
              <KeyboardBackspaceIcon />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Duplicate Warning Alert */}
            {errors.duplicate && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-red-600 font-semibold">⚠️ {errors.duplicate}</span>
                </div>
              </div>
            )}

            {/* Basic Fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Process <span className="text-red-500">*</span>
                </label>
                <Select
                  name="process_id"
                  value={formData.process_id}
                  onChange={handleProcessChange}
                  displayEmpty
                  className="w-full"
                  disabled={!!rateCardId}
                >
                  <MenuItem value="">
                    <span className="text-gray-400">Select process</span>
                  </MenuItem>
                  {processes.map((process) => (
                    <MenuItem key={process._id} value={process._id}>
                      {process.service_category?.name || process.name} - {process.type}
                    </MenuItem>
                  ))}
                </Select>
                {errors.process_id && (
                  <span className="text-red-500 text-sm">{errors.process_id}</span>
                )}
                {rateCardId && (
                  <span className="text-xs text-gray-500 mt-1 block">
                    Process cannot be changed while editing
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

              {/* Is Internal Checkbox */}
              <div className="md:col-span-2">
                <FormControlLabel
                  control={
                    <Checkbox
                      name="is_internal"
                      checked={formData.is_internal}
                      onChange={handleInputChange}
                      color="primary"
                      disabled={!!rateCardId || !formData.process_id}
                    />
                  }
                  label="Internal Rate Card (Own Inventory)"
                />
                <p className="text-xs text-gray-500 ml-8">
                  Check this if materials are available in your own inventory
                </p>
                {rateCardId && (
                  <span className="text-xs text-gray-500 ml-8 block">
                    Type cannot be changed while editing
                  </span>
                )}
                {!rateCardId && !formData.process_id && (
                  <span className="text-xs text-gray-500 ml-8 block">
                    Please select a process first
                  </span>
                )}
              </div>

              {/* Vendor Selection - Only show when not internal */}
              {!formData.is_internal && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Vendor <span className="text-red-500">*</span>
                  </label>
                  <Select
                    name="vendor"
                    value={formData.vendor}
                    onChange={handleVendorChange}
                    displayEmpty
                    className="w-full"
                    disabled={!selectedProcess || !!rateCardId}
                  >
                    <MenuItem value="">
                      <span className="text-gray-400">Select vendor</span>
                    </MenuItem>
                    {getVendorList().map((vendor) => (
                      <MenuItem key={vendor._id} value={vendor._id}>
                        {`${vendor.name} - ${vendor.service_category?.name} - ${vendor.contract_type?.name}`}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.vendor && (
                    <span className="text-red-500 text-sm">{errors.vendor}</span>
                  )}
                  {!selectedProcess && (
                    <span className="text-xs text-gray-500 mt-1 block">
                      Please select a process first to view available vendors
                    </span>
                  )}
                  {rateCardId && (
                    <span className="text-xs text-gray-500 mt-1 block">
                      Vendor cannot be changed while editing
                    </span>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">
                  Rate Unit
                </label>
                <input
                  type="text"
                  name="rate_unit"
                  value={formData.rate_unit}
                  onChange={handleInputChange}
                  placeholder="e.g., per min, per sq ft"
                  className="w-full border px-3 py-2 rounded-lg"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Remarks
                </label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Enter any additional remarks"
                  className="w-full border px-3 py-2 rounded-lg"
                />
              </div>
            </div>

            {/* Variable Rates Section */}
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Variable Rates</h2>
              </div>

              {!selectedProcess && (
                <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
                  Please select a process to configure variable rates
                </div>
              )}

              {selectedProcess && variableRates.length === 0 && (
                <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
                  This process has no rate variables defined
                </div>
              )}

              {errors.variableRates && (
                <p className="text-red-600 text-sm mb-3">{errors.variableRates}</p>
              )}

              {/* Display Variable Rates */}
              {selectedProcess && variableRates.length > 0 && (
                <div className="space-y-3">
                  {variableRates.map((rate, index) => {

                    const rateVariables =
                      selectedProcess.variables?.filter(
                        (v) => v.is_rate_variable
                      ) || [];

                    return (
                      <div
                        key={index}
                        className="p-4 bg-gray-50 border rounded-lg"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-medium text-gray-700">
                            Rate #{index + 1}
                          </h3>
                        </div>

                        <div className="grid md:grid-cols-3 gap-3">
                          {/* Dynamic fields based on rate variables */}
                          {rateVariables.map((variable) => (
                            <div key={variable.key}>
                              <label className="block text-sm font-medium mb-1">
                                {variable.label}
                              </label>
                              <Select
                                value={rate[variable.key] || ""}
                                onChange={(e) =>
                                  handleVariableRateChange(
                                    index,
                                    variable.key,
                                    e.target.value
                                  )
                                }
                                displayEmpty
                                className="w-full"
                                disabled={true}
                              >
                                <MenuItem value="">
                                  <span className="text-gray-400">
                                    Select {variable.label.toLowerCase()}
                                  </span>
                                </MenuItem>
                                {variable.allowed_values.map((value) => (
                                  <MenuItem key={value} value={value}>
                                    {value}
                                  </MenuItem>
                                ))}
                              </Select>
                            </div>
                          ))}

                          {/* Price field */}
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Price <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              value={rate.price}
                              onChange={(e) =>
                                handleVariableRateChange(
                                  index,
                                  "price",
                                  e.target.value
                                )
                              }
                              min="0"
                              step="1"
                              placeholder="Enter price"
                              className="w-full border px-3 py-2 rounded-lg"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
                disabled={isLoading || errors.duplicate}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isLoading
                  ? "Saving..."
                  : rateCardId
                    ? "Update"
                    : "Submit"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateCardForm;