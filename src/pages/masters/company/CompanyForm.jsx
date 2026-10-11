import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import {
  createCompany,
  getCompanyById,
  updateCompany,
  clearCompanyDetails,
  clearCompanyError,
} from "../../../reducer/companyReducer";

const CompanyForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { companyId } = useParams();

  const isEditMode = !!companyId;

  const { companyDetails, loading } = useSelector((state) => state.company);

  const [formData, setFormData] = useState({
    company_name: "",
    is_active: null,
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (isEditMode) {
      dispatch(getCompanyById(companyId));
    }
    return () => {
      dispatch(clearCompanyDetails());
      dispatch(clearCompanyError());
    };
  }, [dispatch, isEditMode, companyId]);

  useEffect(() => {
    if (isEditMode && companyDetails) {
      setFormData({
        company_name: companyDetails.company_name || "",
        is_active: companyDetails.is_active ?? null,
      });
    }
  }, [isEditMode, companyDetails]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "is_active") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "active" ? true : value === "inactive" ? false : null,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.company_name.trim()) {
      errors.company_name = "Company Name is required";
    }
    if (formData.is_active === null) {
      errors.is_active = "Status is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({ company_name: "", is_active: null });
    setFormErrors({});
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    try {
      if (isEditMode) {
        await dispatch(updateCompany({ id: companyId, formData })).unwrap();
        toast.success("Company updated successfully");
      } else {
        await dispatch(createCompany(formData)).unwrap();
        toast.success("Company created successfully");
      }
      navigate("/company");
    } catch (err) {
      toast.error(err || `Failed to ${isEditMode ? "update" : "create"} company`);
    }
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
              {isEditMode ? "Edit Company" : "Create Company"}
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
              {/* Company Name */}
              <div className="space-y-2">
                <label
                  htmlFor="company_name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="company_name"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  disabled={loading}
                  className={`w-full px-4 py-2.5 rounded-lg border ${formErrors.company_name ? "border-red-500" : "border-gray-300"
                    } focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition`}
                  placeholder="Enter company name"
                />
                {formErrors.company_name && (
                  <p className="text-red-600 text-sm">{formErrors.company_name}</p>
                )}
              </div>

              {/* Status Dropdown */}
              <div className="space-y-2">
                <FormControl
                  fullWidth
                  variant="outlined"
                  size="small"
                  error={!!formErrors.is_active}
                >
                  <label
                    className="block text-sm font-semibold text-gray-700 mb-2"
                    htmlFor="is_active"
                  >
                    Status <span className="text-red-600">*</span>
                  </label>

                  <Select
                    id="is_active"
                    name="is_active"
                    value={
                      formData.is_active === null
                        ? ""
                        : formData.is_active === true
                          ? "active"
                          : "inactive"
                    }
                    onChange={handleInputChange}
                    displayEmpty
                    size="small"
                    disabled={loading}
                    renderValue={(selected) => {
                      if (!selected) {
                        return <span>Select status</span>;
                      }
                      return selected === "active" ? "Active" : "Inactive";
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          "& .MuiMenuItem-root.Mui-disabled": {
                            opacity: 1,
                            color: "var(--theme-text-muted)",
                          },
                        },
                      },
                    }}
                  >
                    <MenuItem value="" disabled>
                      <span className="text-[var(--theme-text-muted)]">
                        Select status
                      </span>
                    </MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>

                  {formErrors.is_active && (
                    <p className="text-red-600 text-sm mt-1">
                      {formErrors.is_active}
                    </p>
                  )}
                </FormControl>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              {isEditMode ? (
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2.5 text-white font-medium rounded-lg transition flex items-center"
                  style={{ backgroundColor: "#574fdd" }}
                  disabled={loading}
                >
                  {loading && (
                    <svg
                      className="w-5 h-5 mr-2 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                  )}
                  {loading ? "Updating..." : "Update"}
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
                    className="px-6 py-2.5 text-white font-medium rounded-lg transition flex items-center"
                    style={{ backgroundColor: "#574fdd" }}
                    disabled={loading}
                  >
                    {loading && (
                      <svg
                        className="w-5 h-5 mr-2 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        />
                      </svg>
                    )}
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

export default CompanyForm;