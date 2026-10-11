import React, { useEffect, useState } from "react";
import "../../../App.css";
import { useNavigate, useParams } from "react-router-dom";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
import { toast } from "react-toastify";
import { useLoader } from "../../../context/LoaderContext";
import axios from "axios";
import { axiosInstance, backendUrl } from "../../../utils/url/config";
import PERMISSIONS from '../../../utils/permission/permission.json';
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
const PERMISSIONS_JSON = PERMISSIONS


const RolesForm = () => {
  const { roleId } = useParams();
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoader();

  const [formData, setFormData] = useState({
    role: "",
    isActive: null,
  });

  const [permissionsList] = useState(PERMISSIONS_JSON.permissions);
  const [selectedPermission, setSelectedPermission] = useState("");
  const [permissions, setPermissions] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!roleId) return;

    const fetchRole = async () => {
      showLoader();
      try {
        const res = await axiosInstance.get(`${backendUrl}/role/${roleId}`);
        const data = res.data.data;
        setFormData({ role: data.name, isActive: data.is_active });
        setPermissions(data.permission || []);
      } catch {
        toast.error("Failed to load role data");
      } finally {
        hideLoader();
      }
    };

    fetchRole();
  }, [roleId, showLoader, hideLoader]);

  const handlePermissionAdd = () => {
    if (!selectedPermission) {
      setErrors((prev) => ({
        ...prev,
        selectedPermission: "Please select a permission",
      }));
      return;
    }

    const id = parseInt(selectedPermission, 10);
    if (permissions.includes(id)) {
      toast.error("Permission already added");
      return;
    }

    setPermissions((prev) => [...prev, id]);
    setSelectedPermission("");
    setErrors((prev) => ({ ...prev, selectedPermission: "" }));
  };

  const removePermission = (index) => {
    setPermissions((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData({ role: "" });
    setPermissions([]);
    setSelectedPermission("");
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.role.trim()) newErrors.role = "Role is required";
    if (permissions.length === 0)
      newErrors.permissions = "At least one permission is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    const payload = {
      name: formData.role,
      permission: permissions,
      is_active: formData.isActive,
    };

    setIsLoading(true);
    showLoader();
    try {
      if (roleId) {
        const res = await axiosInstance.put(`${backendUrl}/role/${roleId}`, payload);
        toast.success(res?.data?.message || "Role updated successfully");
      } else {
        const res = await axiosInstance.post(`${backendUrl}/role`, payload);
        toast.success(res?.data?.message);
      }
      navigate("/roles");
    } catch (err) {
      const msg = err.response?.data?.message || "Submission failed";
      toast.error(msg);
    } finally {
      setIsLoading(false);
      hideLoader();
    }
  };

  const getPermissionName = (id) => {
    const match = permissionsList.find((perm) => perm.permission === id);
    return match?.module || `Permission ${id}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "isActive") {
      // Convert string value to boolean or null
      setFormData((prev) => ({
        ...prev,
        [name]: value === "active" ? true : value === "inactive" ? false : null,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setErrors((prev) => ({ ...prev, [name]: "" })); // clear error
  };

  return (
    <div
      className="bg-gray-100 font-sans min-h-screen form-display"
      style={{ marginTop: "80px" }}
    >
      <div className="form-display flex items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Header */}
          <div className="border-b border-gray-100 p-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">
              {roleId ? "Edit Role" : "Create Role"}
            </h1>
            <button
              onClick={() => navigate(-1)}
              className="text-sm hover:bg-blue-200 text-blue-600 font-semibold py-2 px-4 rounded"
            >
              <KeyboardBackspaceIcon />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-7">
              {/* Role Name */}
              <div className="space-y-2">
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-700"
                >
                  Role <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${errors.role ? "border-red-500" : "border-gray-300"
                    } focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition`}
                  placeholder="Enter role"
                />
                {errors.role && (
                  <p className="text-red-600 text-sm">{errors.role}</p>
                )}
              </div>

              <div className="space-y-2">
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
                    id="isActive"
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

              {/* Permission Dropdown */}
              <div className="space-y-2">
                <FormControl fullWidth variant="outlined" size="small">
                  <label
                    className="block text-sm font-semibold text-gray-700 mb-2"
                    htmlFor="selectedPermission"
                  >
                    Add Permission <span className="text-red-600">*</span>
                  </label>

                  <div className="flex gap-2 items-start mb-1">
                    <div className="flex-1">
                      <Select
                        id="selectedPermission"
                        value={selectedPermission}
                        onChange={(e) => setSelectedPermission(e.target.value)}
                        displayEmpty
                        size="small"
                        className={`w-full ${errors.selectedPermission ? "border-red-500" : ""}`}
                      >
                        <MenuItem value="">
                          <span className="text-[var(--theme-text-muted)]">
                            Select a permission
                          </span>
                        </MenuItem>

                        {permissionsList
                          .filter((perm) => !permissions.includes(perm.permission))
                          .sort((a, b) => a.module.localeCompare(b.module))
                          .map((perm) => (
                            <MenuItem key={perm.permission} value={perm.permission}>
                              {perm.module}
                            </MenuItem>
                          ))}
                      </Select>
                    </div>

                    <button
                      onClick={handlePermissionAdd}
                      className="px-4 py-[6px] primary-bgclr hover:bg-blue-600 text-white font-medium rounded-md transition flex items-center whitespace-nowrap text-sm h-[40px] mt-[1px]"
                      style={{ backgroundColor: "#574fdd" }}
                    >
                      <span className="mr-1">+</span>Add
                    </button>
                  </div>

                  {errors.selectedPermission && (
                    <p className="text-red-600 text-sm mb-3">{errors.selectedPermission}</p>
                  )}
                </FormControl>
              </div>
            </div>

            {/* Selected Permissions Tags */}
            <div className="mb-8">
              <div className="flex flex-wrap gap-2">
                {permissions.map((permId, index) => (
                  <div
                    key={index}
                    className="flex items-center px-3 py-2 bg-white border border-gray-200 rounded-lg transition-all hover:shadow-md"
                  >
                    <span>{getPermissionName(permId)}</span>
                    <button
                      type="button"
                      onClick={() => removePermission(index)}
                      className="ml-2 text-red-500 hover:text-red-700"
                      title="Remove permission"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
              {errors.permissions && (
                <p className="text-red-600 text-sm mt-2">
                  {errors.permissions}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              {roleId ? (
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2.5 primary-bgclr hover:bg-blue-600 text-white font-medium rounded-lg transition flex items-center"
                  style={{ backgroundColor: "#574fdd" }}
                  disabled={isLoading}
                >
                  {isLoading && (
                    <svg
                      className="w-5 h-5 mr-2 animate-spin"
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
                  )}
                  {isLoading ? "Updating..." : "Update"}
                </button>
              ) : (
                <>
                  <button
                    onClick={resetForm}
                    className="px-5 py-2.5 bg-white border border-red-500 text-red-500 hover:bg-red-50 font-medium rounded-lg transition flex items-center"
                    type="button"
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-2.5 primary-bgclr hover:bg-blue-600 text-white font-medium rounded-lg transition flex items-center"
                    style={{ backgroundColor: "#574fdd" }}
                    disabled={isLoading}
                  >
                    {isLoading && (
                      <svg
                        className="w-5 h-5 mr-2 animate-spin"
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
                    )}
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

export default RolesForm;
