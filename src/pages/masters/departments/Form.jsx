import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { axiosInstance, backendUrl } from "../../../utils/url/config";
import { useLoader } from "../../../context/LoaderContext";
import { toast } from "react-toastify";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
import { capitalizeFirst } from "../../../utils/helper/capitalize";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { useDispatch, useSelector } from "react-redux";
import { getDepartmentById } from "../../../reducer/departmentReducer";
import {
  getAllProcesses
} from "../../../reducer/processReducer";
const DepartmentForm = () => {
  const { departmentId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showLoader, hideLoader } = useLoader();

  const [formData, setFormData] = useState({
    name: "",
    isActive: null,
    type: "",
  });
  const [selectedProcessId, setSelectedProcessId] = useState("");
  const [selectedProcesses, setSelectedProcesses] = useState([]);
  // const [allProcesses, setAllProcesses] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const { processes } = useSelector(state => state.process);

  const { singleDepartment } = useSelector(state => state.department);


  const allProcesses = processes;

  // Fetch all processes
  const getProccessList = useCallback(async () => {
    showLoader();
    try {
      await dispatch(getAllProcesses({ is_active: true, order: 'asc' }));
    } catch {
      toast.error("Failed to load processes");
    } finally {
      hideLoader();
    }
  }, [dispatch, showLoader, hideLoader]);

  // Fetch department for edit
  const fetchDepartment = useCallback(async () => {
    if (!departmentId) return;
    showLoader();
    try {
      await dispatch(getDepartmentById(departmentId));
    } catch {
      toast.error("Failed to load department data");
    } finally {
      hideLoader();
    }
  }, [dispatch, departmentId, showLoader, hideLoader]);

  useEffect(() => {
    getProccessList();
  }, [getProccessList]);

  useEffect(() => {
    if (!departmentId || !singleDepartment) return;
    setFormData({
      name: singleDepartment.name,
      isActive: singleDepartment.is_active,
      type: singleDepartment.type || "",
    });
    setSelectedProcesses(singleDepartment.under_process || []);
  }, [singleDepartment, departmentId])

  useEffect(() => {
    if (departmentId) fetchDepartment();
  }, [fetchDepartment, departmentId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "isActive") {
      setFormData((prev) => ({ ...prev, [name]: value === "active" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setErrors((prev) => ({ ...prev, [name]: "" })); // clear field error
  };

  const addProcess = () => {
    if (!selectedProcessId) {
      setErrors((prev) => ({ ...prev, process: "Please select a process" }));
      return;
    }
    const selectedProcess = allProcesses.find(
      (p) => p._id === selectedProcessId
    );
    if (!selectedProcess) return toast.error("Process not found");
    if (selectedProcesses.some((p) => p._id === selectedProcess._id))
      return toast.error("Process already added");

    setSelectedProcesses((prev) => [...prev, selectedProcess]);
    setSelectedProcessId("");
    setErrors((prev) => ({ ...prev, process: "" }));
  };

  const removeProcess = (index) => {
    setSelectedProcesses((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragStart = (_, index) => setDraggedIndex(index);
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (_, dropIndex) => {
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    const newProcesses = [...selectedProcesses];
    const [draggedItem] = newProcesses.splice(draggedIndex, 1);
    newProcesses.splice(dropIndex, 0, draggedItem);
    setSelectedProcesses(newProcesses);
    setDraggedIndex(null);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Department Name is required";
    // if (selectedProcesses.length === 0)
    //   newErrors.process = "At least one process must be selected";
    if (formData.isActive === null)
      newErrors.isActive = "Please select Active or Inactive status";
    if (!formData.type) newErrors.type = "Please select type";

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
      under_process: selectedProcesses.map((p) => p._id),
      is_active: formData.isActive ? 1 : 0,
      type: formData.type,
    };
    setIsLoading(true);

    showLoader();
    try {
      if (departmentId) {
        await axiosInstance.put(`${backendUrl}/department/${departmentId}`, payload);
        toast.success("Department updated successfully");
      } else {
        await axiosInstance.post(`${backendUrl}/department`, payload);
        toast.success("Department created successfully");
      }
      navigate("/departments");
    } catch (err) {
      const msg =
        err.response?.data?.message || "Failed to submit the department data";
      toast.error(msg);
    } finally {
      setIsLoading(false);

      hideLoader();
    }
  };

  const resetForm = () => {
    setFormData({ name: "", isActive: null, type: "" });
    setSelectedProcessId("");
    setSelectedProcesses([]);
    setErrors({});
  };

  const availableProcesses = allProcesses.filter(
    (p) => !selectedProcesses.some((sp) => sp._id === p._id)
  );

  return (
    <div
      className="bg-gray-100 font-sans min-h-screen form-display"
      style={{ marginTop: "80px" }}
    >
      <div className="form-display flex items-center justify-center p-4">
        <div className="w-full max-w-6xl bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-100 p-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">
              {departmentId ? "Edit Department" : "Create Department"}
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
              {/* Department Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${errors.name ? "border-red-500" : "border-gray-300"
                    } focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition`}
                  placeholder="Enter department name"
                />
                {errors.name && (
                  <p className="text-red-600 text-sm">{errors.name}</p>
                )}
              </div>

              {/* Status */}
              {/* <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="isActive"
                  value={
                    formData.isActive === null
                      ? ""
                      : formData.isActive
                      ? "active"
                      : "inactive"
                  }
                  onChange={handleInputChange}
                  className={`appearance-none w-full px-4 py-2.5 rounded-lg border ${
                    errors.isActive ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition bg-white pr-10`}
                >
                  <option value="" disabled>
                    Select status
                  </option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                {errors.isActive && (
                  <p className="text-red-600 text-sm">{errors.isActive}</p>
                )}
              </div> */}
              <FormControl
                fullWidth
                variant="outlined"
                size="small"
                error={!!errors.isActive}
              >
                <label
                  className="block text-sm font-semibold text-gray-700 mb-2"
                  htmlFor="status-select"
                >
                  Status <span className="text-red-600">*</span>
                </label>

                <Select
                  name="isActive"
                  id="status-select"
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
                  renderValue={(selected) => {
                    if (!selected) {
                      return <span >Select status</span>;
                    }
                    return selected === "active" ? "Active" : "Inactive";
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        '& .MuiMenuItem-root.Mui-disabled': {
                          opacity: 1,
                          color: 'var(--theme-text-muted)',
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="" disabled>
                    <span className="text-[var(--theme-text-muted)]">Select status</span>
                  </MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>

                {errors.isActive && (
                  <p className="text-red-600 text-sm mt-1">{errors.isActive}</p>
                )}
              </FormControl>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

              {/* Department Type */}
              {/* <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Department Type <span className="text-red-500">*</span>
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className={`appearance-none w-full px-4 py-2.5 rounded-lg border ${
                errors.type ? "border-red-500" : "border-gray-300"
              } focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition bg-white pr-10`}
            >
              <option value="" disabled>
                Select type
              </option>
              <option value="In House">In House</option>
              <option value="Out Source">Out Source</option>
            </select>
            {errors.type && (
              <p className="text-red-600 text-sm">{errors.type}</p>
            )}
</div> */}
              <FormControl
                fullWidth
                variant="outlined"
                size="small"
                error={!!errors.type}
              >
                <label
                  className="block text-sm font-semibold text-gray-700 mb-2"
                  htmlFor="type-select"
                >
                  Department Type <span className="text-red-600">*</span>
                </label>

                <Select
                  name="type"
                  id="type-select"
                  value={formData.type}
                  onChange={handleInputChange}
                  displayEmpty
                  size="small"
                  // This controls what is shown in the closed select box
                  renderValue={(selected) => {
                    if (!selected) {
                      // Placeholder: BLUE
                      return <span >Select type</span>;
                    }
                    // Selected value: BLACK (default MUI text color is already black)
                    return <span style={{ color: 'black' }}>{selected}</span>;
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        // Keep the placeholder inside the dropdown muted (optional)
                        '& .MuiMenuItem-root.Mui-disabled': {
                          opacity: 1,
                          color: 'var(--theme-text-muted)',
                        },
                      },
                    },
                  }}
                >
                  {/* Placeholder in dropdown list (muted) */}
                  <MenuItem value="" disabled>
                    <span className="text-[var(--theme-text-muted)]">Select type</span>
                  </MenuItem>

                  <MenuItem value="In House">In House</MenuItem>
                  <MenuItem value="Out Source">Out Source</MenuItem>
                  <MenuItem value="Both">Both</MenuItem>
                </Select>

                {errors.type && (
                  <p className="text-red-600 text-sm mt-1">{errors.type}</p>
                )}
              </FormControl>




              {/* Process Section */}
              {/* <div className="mb-8">
             <FormControl fullWidth variant="outlined" size="small">
  <label
    className="block text-sm font-semibold text-gray-700 mb-2"
    htmlFor="process-select"
  >
    Add Process Under This Department <span className="text-red-600">*</span>
  </label>

  <div className="flex gap-2 items-start mb-4">
    <div className="flex-1">
      <Select
        value={selectedProcessId}
        onChange={(e) => setSelectedProcessId(e.target.value)}
        displayEmpty
        size="small"
        className={`w-full ${errors.process ? "border-red-500" : ""}`}
        inputProps={{
          id: "process-select",
        }}
      >
        <MenuItem value="">
          <span className="text-[var(--theme-text-muted)]">
            Select a process
          </span>
        </MenuItem>
        
        {availableProcesses.map((p) => (
          <MenuItem key={p._id} value={p._id}>
            {capitalizeFirst(p.name)}
          </MenuItem>
        ))}
      </Select>
    </div>
    
    <button
      onClick={addProcess}
      className="px-4 py-[6px] primary-bgclr hover:bg-blue-600 text-white font-medium rounded-md transition flex items-center whitespace-nowrap text-sm h-[40px] mt-[1px]"
    >
      <span className="mr-1">+</span>Add
    </button>
  </div>

  {errors.process && (
    <p className="text-red-600 text-sm mb-3">{errors.process}</p>
  )}

  <div className="flex flex-wrap gap-2">
    {selectedProcesses.map((process, index) => (
      <div
        key={process._id}
        draggable
        onDragStart={(e) => handleDragStart(e, index)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, index)}
        onDragEnd={() => setDraggedIndex(null)}
        className={`flex items-center px-3 py-2 bg-white border rounded-lg cursor-move ${
          draggedIndex === index ? "opacity-50 scale-105" : ""
        }`}
      >
        <span className="flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full mr-2">
          {index + 1}
        </span>
        <span className="text-gray-700 mr-2">{process.name}</span>
        <button
          onClick={() => removeProcess(index)}
          className="text-red-500 hover:text-red-600"
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
</FormControl>
            </div> */}

            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              {departmentId ? (
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2.5 primary-bgclr hover:bg-blue-600 text-white font-medium rounded-lg transition flex items-center"
                  style={{ backgroundColor: "#574fdd" }}

                  disabled={isLoading} // Disable button when loading
                >
                  {isLoading ? (
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
                    className="px-5 py-2.5 bg-white border border-red-500 text-red-500 hover:bg-red-50 font-medium rounded-lg transition"
                    type="button"
                    disabled={isLoading} // Disable button when loading
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-2.5 primary-bgclr hover:bg-blue-600 text-white font-medium rounded-lg transition flex items-center"
                    style={{ backgroundColor: "#574fdd" }}
                    disabled={isLoading} // Disable button when loading
                  >
                    {isLoading ? (
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

export default DepartmentForm;
