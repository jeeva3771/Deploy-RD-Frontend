import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";

const EmployeeForm = ({ employee, departments, onSave, onCancel }) => {
  const { roles } = useSelector((state) => state.role);
  
  const [formData, setFormData] = useState({
    name: "", // This will be the role/designation
    title: "", // This is the employee's actual name
    username: "",
    password: "",
    doj: "",
    age: "",
    phone1: "",
    phone2: "",
    deptId: "",
    roleId: "",
    status: "Active",
  });

  const [errors, setErrors] = useState({});

  // Populate form when editing
  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || "",
        title: employee.title || "",
        username: employee.username || "",
        password: "", // Don't populate password for security
        doj: employee.doj || "",
        age: employee.age || "",
        phone1: employee.phone1 || "",
        phone2: employee.phone2 || "",
        deptId: employee.deptId || "",
        roleId: employee.roleId || "",
        status: employee.status || "Active",
      });
    }
  }, [employee]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title?.trim()) {
      newErrors.title = "Employee name is required";
    }
    
    if (!employee && !formData.username?.trim()) {
      newErrors.username = "Username is required";
    }
    
    if (!employee && !formData.password?.trim()) {
      newErrors.password = "Password is required for new employees";
    }
    
    if (!formData.doj) {
      newErrors.doj = "Date of joining is required";
    }
    
    if (!formData.phone1?.trim()) {
      newErrors.phone1 = "Primary phone is required";
    }
    
    if (!formData.phone2?.trim()) {
      newErrors.phone2 = "Emergency phone is required";
    }
    
    if (!formData.deptId) {
      newErrors.deptId = "Department is required";
    }
    
    if (!formData.roleId) {
      newErrors.roleId = "Role is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    onSave(formData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Employee Name (Title) */}
      <div className="flex flex-col gap-2">
        <label className="font-semibold text-slate-700 text-sm">
          Employee Name <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="e.g. John Doe"
          className={`px-3 py-2 border ${
            errors.title ? 'border-red-500' : 'border-slate-300'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all`}
        />
        {errors.title && (
          <p className="text-red-600 text-xs">{errors.title}</p>
        )}
      </div>

      {/* Username - Only for new employees */}
      {!employee && (
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-slate-700 text-sm">
            Username <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            placeholder="e.g. john.doe"
            className={`px-3 py-2 border ${
              errors.username ? 'border-red-500' : 'border-slate-300'
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all`}
          />
          {errors.username && (
            <p className="text-red-600 text-xs">{errors.username}</p>
          )}
        </div>
      )}

      {/* Password - Only for new employees */}
      {!employee && (
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-slate-700 text-sm">
            Password <span className="text-red-600">*</span>
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Enter password"
            className={`px-3 py-2 border ${
              errors.password ? 'border-red-500' : 'border-slate-300'
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all`}
          />
          {errors.password && (
            <p className="text-red-600 text-xs">{errors.password}</p>
          )}
        </div>
      )}

      {/* Department and Role */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-slate-700 text-sm">
            Department <span className="text-red-600">*</span>
          </label>
          <select
            name="deptId"
            value={formData.deptId}
            onChange={handleInputChange}
            className={`px-3 py-2 border ${
              errors.deptId ? 'border-red-500' : 'border-slate-300'
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all`}
          >
            <option value="">Select department</option>
            {departments?.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.name}
              </option>
            ))}
          </select>
          {errors.deptId && (
            <p className="text-red-600 text-xs">{errors.deptId}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-semibold text-slate-700 text-sm">
            Role/Designation <span className="text-red-600">*</span>
          </label>
          <select
            name="roleId"
            value={formData.roleId}
            onChange={handleInputChange}
            className={`px-3 py-2 border ${
              errors.roleId ? 'border-red-500' : 'border-slate-300'
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all`}
          >
            <option value="">Select role</option>
            {roles?.map((role) => (
              <option key={role._id} value={role._id}>
                {role.name}
              </option>
            ))}
          </select>
          {errors.roleId && (
            <p className="text-red-600 text-xs">{errors.roleId}</p>
          )}
        </div>
      </div>

      {/* Date of Joining */}
      <div className="flex flex-col gap-2">
        <label className="font-semibold text-slate-700 text-sm">
          Date of Joining <span className="text-red-600">*</span>
        </label>
        <input
          type="date"
          name="doj"
          value={formData.doj}
          onChange={handleInputChange}
          max={new Date().toISOString().split('T')[0]}
          className={`px-3 py-2 border ${
            errors.doj ? 'border-red-500' : 'border-slate-300'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all`}
        />
        {errors.doj && (
          <p className="text-red-600 text-xs">{errors.doj}</p>
        )}
      </div>

      {/* Phone Numbers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-slate-700 text-sm">
            Primary Phone <span className="text-red-600">*</span>
          </label>
          <input
            type="tel"
            name="phone1"
            value={formData.phone1}
            onChange={handleInputChange}
            placeholder="9876543210"
            className={`px-3 py-2 border ${
              errors.phone1 ? 'border-red-500' : 'border-slate-300'
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all`}
          />
          {errors.phone1 && (
            <p className="text-red-600 text-xs">{errors.phone1}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-semibold text-slate-700 text-sm">
            Emergency Phone <span className="text-red-600">*</span>
          </label>
          <input
            type="tel"
            name="phone2"
            value={formData.phone2}
            onChange={handleInputChange}
            placeholder="9876543210"
            className={`px-3 py-2 border ${
              errors.phone2 ? 'border-red-500' : 'border-slate-300'
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all`}
          />
          {errors.phone2 && (
            <p className="text-red-600 text-xs">{errors.phone2}</p>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {employee ? "Update" : "Add"} Employee
        </button>
      </div>
    </form>
  );
};

export default EmployeeForm;