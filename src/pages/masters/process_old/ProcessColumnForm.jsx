import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProcessColumnById,
  createProcessColumn,
  updateProcessColumn,
  clearSelectedProcessColumn,
} from "../../../reducer/processColumnReducer";
import { toast } from "react-toastify";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

const ProcessColumnForm = () => {
  const { processcolumnId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { selectedProcessColumn, loading } = useSelector(
    (state) => state.processColumn
  );

  const [formData, setFormData] = useState({
    name: "",
    is_active: null,
  });

  const [errors, setErrors] = useState({});

  const isEdit = Boolean(processcolumnId);

  // Fetch process column data when editing
  useEffect(() => {
    if (processcolumnId) {
      const fetchData = async () => {
        try {
          await dispatch(fetchProcessColumnById(processcolumnId)).unwrap();
        } catch (error) {
          toast.error(error?.message || "Failed to load process column data");
        }
      };
      fetchData();
    }

    return () => {
      dispatch(clearSelectedProcessColumn());
    };
  }, [processcolumnId, dispatch]);

  // Populate form when selectedProcessColumn is loaded
  useEffect(() => {
    if (selectedProcessColumn && processcolumnId) {
      setFormData({
        name: selectedProcessColumn.name || "",
        is_active: selectedProcessColumn.is_active,
      });
    }
  }, [selectedProcessColumn, processcolumnId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "is_active") {
      setFormData((prev) => ({ ...prev, [name]: value === "active" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Column Name is required";
    if (formData.is_active === null)
      newErrors.is_active = "Please select status";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: "",
      is_active: null,
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
      is_active: formData.is_active,
    };

    try {
      if (isEdit) {
        await dispatch(
          updateProcessColumn({ id: processcolumnId, formData: payload })
        ).unwrap();
        toast.success("Process Column updated successfully");
      } else {
        await dispatch(createProcessColumn(payload)).unwrap();
        toast.success("Process Column created successfully");
      }
      navigate("/processcolumn");
    } catch (err) {
      const msg = err?.message || "Failed to submit process column data";
      toast.error(msg);
    }
  };

  return (
    <div
      className="bg-gray-100 font-sans min-h-screen form-display"
      style={{ marginTop: "80px" }}
    >
      <div className="form-display flex items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-100 p-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">
              {isEdit ? "Edit Process Column" : "Create Process Column"}
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
              {/* Column Name */}
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Column Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${errors.name ? "border-red-500" : "border-gray-300"
                    } focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition`}
                  placeholder="Enter column name"
                />
                {errors.name && (
                  <p className="text-red-600 text-sm">{errors.name}</p>
                )}
              </div>

              {/* Status */}
              <FormControl fullWidth variant="outlined" size="small">
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
                      : formData.is_active
                        ? "active"
                        : "inactive"
                  }
                  onChange={handleInputChange}
                  displayEmpty
                  size="small"
                  error={!!errors.is_active}
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

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              {isEdit ? (
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2.5 primary-bgclr hover:bg-blue-600 text-white font-medium rounded-lg transition"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update"}
                </button>
              ) : (
                <>
                  <button
                    onClick={resetForm}
                    className="px-5 py-2.5 bg-white border border-red-500 text-red-500 hover:bg-red-50 font-medium rounded-lg transition"
                    type="button"
                    disabled={loading}
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-2.5 primary-bgclr hover:bg-blue-600 text-white font-medium rounded-lg transition"
                    disabled={loading}
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

export default ProcessColumnForm;