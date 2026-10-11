import React from "react";
import { FormControl, Select, MenuItem } from "@mui/material";
import { capitalizeFirst } from "../../../utils/helper/capitalize";

const OutsourceVendorForm = ({
  formData,
  setFormData,
  errors,
  isSubmitting,
  processes,
  processesLoading,
  onInputChange,
  onSubmit,
  vendorId,
  resetForm
}) => {
  return (
    <form
      onSubmit={onSubmit}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Vendor Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vendor Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name ?? ""}
            onChange={onInputChange}
            placeholder="Enter vendor name"
            className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          {errors.name && (
            <span className="text-red-500 text-xs mt-1">{errors.name}</span>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email ?? ""}
            onChange={onInputChange}
            placeholder="Enter email"
            className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          {errors.email && (
            <span className="text-red-500 text-xs mt-1">{errors.email}</span>
          )}
        </div>

        {/* WhatsApp No */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            WhatsApp No <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="whatsapp_no"
            value={formData.whatsapp_no ?? ""}
            onChange={onInputChange}
            placeholder="Enter WhatsApp"
            className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          {errors.whatsapp_no && (
            <span className="text-red-500 text-xs mt-1">{errors.whatsapp_no}</span>
          )}
        </div>

        {/* Has GST */}
        <div>
          <FormControl fullWidth size="small">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Has GST Number? <span className="text-red-500">*</span>
            </label>
            <Select
              name="has_gst"
              value={formData.has_gst === null ? "" : formData.has_gst ? "yes" : "no"}
              onChange={onInputChange}
              displayEmpty
              error={!!errors.has_gst}
            >
              <MenuItem value="">
                <span className="text-[var(--theme-text-muted)]">Select option</span>
              </MenuItem>
              <MenuItem value="yes">Yes</MenuItem>
              <MenuItem value="no">No (Labour)</MenuItem>
            </Select>
            {errors.has_gst && (
              <p className="text-red-600 text-sm mt-1">{errors.has_gst}</p>
            )}
          </FormControl>
        </div>

        {/* GST No */}
        {formData.has_gst === true && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GST Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="gst_no"
              value={formData.gst_no ?? ""}
              onChange={onInputChange}
              placeholder="Enter GST Number"
              className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase"
            />
            {errors.gst_no && (
              <span className="text-red-500 text-xs mt-1">{errors.gst_no}</span>
            )}
          </div>
        )}

        {/* Process Type */}
        <div>
          <FormControl fullWidth size="small">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Process Type <span className="text-red-500">*</span>
            </label>
            <Select
              name="process_type"
              multiple
              value={Array.isArray(formData.process_type) ? formData.process_type : (formData.process_type ? [formData.process_type] : [])}
              onChange={onInputChange}
              displayEmpty
              renderValue={(selected) => {
                if (!selected || selected.length === 0) {
                  return <span className="text-gray-400">Select process(es)</span>;
                }
                return selected.map(val => {
                  const process = processes.find(p => (p._id === val || p.id === val));
                  return process ? capitalizeFirst(process.name) : val;
                }).join(", ");
              }}
              disabled={processesLoading}
              error={!!errors.process_type}
            >
              {processes.map((process) => (
                <MenuItem key={process._id || process.id} value={process._id || process.id}>
                  {capitalizeFirst(process.name)}
                </MenuItem>
              ))}
            </Select>
            {errors.process_type && (
              <p className="text-red-600 text-sm mt-1">{errors.process_type}</p>
            )}
          </FormControl>
        </div>

        {/* Status */}
        <div>
          <FormControl fullWidth size="small">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status <span className="text-red-500">*</span>
            </label>
            <Select
              name="isActive"
              value={formData.isActive === null ? "" : formData.isActive ? "active" : "inactive"}
              onChange={onInputChange}
              displayEmpty
              error={!!errors.isActive}
            >
              <MenuItem value="">
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

        {/* Address */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address <span className="text-red-500">*</span>
          </label>
          <textarea
            name="address"
            value={formData.address ?? ""}
            onChange={onInputChange}
            placeholder="Enter address"
            rows="2"
            className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          {errors.address && (
            <span className="text-red-500 text-xs mt-1">{errors.address}</span>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 border-t border-gray-200 pt-4">
        {vendorId && (
          <button
            type="button"
            onClick={resetForm}
            className="px-5 py-2.5 bg-white border border-red-500 text-red-500 hover:bg-red-50 font-medium rounded-lg transition"
            disabled={isSubmitting}
          >
            Cancel Edit
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{ backgroundColor: "#574fdd" }}
          className={`px-6 py-2.5 rounded-lg text-white transition-colors duration-300 ease-in-out ${
            isSubmitting ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          {isSubmitting ? "Saving..." : vendorId ? "Update" : "Add"}
        </button>
      </div>
    </form>
  );
};

export default OutsourceVendorForm;
