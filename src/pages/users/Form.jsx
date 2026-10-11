import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useLoader } from "../../context/LoaderContext";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
import { capitalizeFirst } from "../../utils/helper/capitalize";
import Select from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import { useDispatch, useSelector } from "react-redux";
import {
  createUser,
  fetchUserById,
  updateUser,
} from "../../reducer/userReducer";
import { getAllRoles } from "../../reducer/roleReducer";
import { getAllDepartments } from "../../reducer/departmentReducer";
import { fetchCompaniesList } from "../../reducer/companyReducer";
import { fetchWorksList } from "../../reducer/workReducer";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { formatDateToDDMMYYYY, formatDateToYYYYMMDD } from "../../utils/enquiry/dateformat";
import { getUserRole } from "../../utils/permission/auth";

const UserForm = ({ userId: propUserId, initialData, onSuccess, onCancel, isModal = false }) => {
  const params = useParams();
  const userId = propUserId || params.userId;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const userRole = getUserRole();

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    doj: "", // Date of Joining
    dob: "",
    phone_number: "",
    emergency_number: "",
    reference_name: "",
    department: "",
    role: "",
    emp_id: "",
    email: "",
    notes: "",
    profileImage: null,
    is_head: false,
    is_pricing_specialist: false,
    is_active: true,
    company_id: "",
    work_id: "",
    only_profile: false,
  });

  const [imagePreview, setImagePreview] = useState(null);
  // const [departments, setDepartments] = useState([]);
  // const [roles, setRoles] = useState([]);
  const { showLoader, hideLoader } = useLoader();
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { selectedUser, successMessage, error } = useSelector(
    (state) => state.user,
  );
  const { departments } = useSelector((state) => state.department);
  const { roles } = useSelector((state) => state.role);
  const { companiesList } = useSelector((state) => state.company);
  const { worksList } = useSelector((state) => state.work);

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isModal) {
      console.log("department and roles useeffect test");
      dispatch(
        getAllDepartments({
          is_active: true,
          order: "asc",
          params: { sortField: "name", sortOrder: "asc" },
        }),
      );
      dispatch(getAllRoles({ is_active: true, order: "asc" }));
      dispatch(fetchCompaniesList({ is_active: true, sortKey: "company_name", sortDir: "asc" }));
      dispatch(fetchWorksList({ is_active: true, sortKey: "work_name", sortDir: "asc" }));
    }
  }, [dispatch, isModal]);

  const fetchUser = useCallback(async () => {
    showLoader();

    try {
      dispatch(fetchUserById(userId));
    } catch (err) {
      console.error("Error fetching user:", err);
      toast.error("Failed to fetch user data.");
    }
    hideLoader();
  }, [dispatch, userId, showLoader, hideLoader]);

  useEffect(() => {
    if (!userId) return;
    fetchUser();
  }, [fetchUser, userId]);

  useEffect(() => {
    const userData = (selectedUser && (selectedUser.id === userId || selectedUser._id === userId)) ? selectedUser : initialData;

    if (userData) {
      setFormData({
        name: userData.name || "",
        username: userData.username || "",
        password: "",
        doj: formatDateToYYYYMMDD(userData.doj) || "",
        dob: formatDateToYYYYMMDD(userData.dob) || "",
        phone_number: userData.phone_number || "",
        emergency_number: userData.emergency_number || "",
        reference_name: userData.reference_name || "",
        department: userData.department_id?._id || userData.department_id || "",
        role: userData.role?._id || userData.role || "",
        profileImage: null,
        is_head: userData.is_head || false,
        emp_id: userData.emp_id || "",
        email: userData.email || "",
        notes: userData.notes || "",
        is_pricing_specialist: userData.is_pricing_specialist || false,
        is_active: userData.is_active,
        company_id: userData.company_id?._id || userData.company_id || "",
        work_id: userData.work_id?._id || userData.work_id || "",
        only_profile: userData.only_profile || false,
      });
      if (userData.image) {
        setImagePreview(userData.image);
      }
    }
  }, [userId, selectedUser, initialData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value === "true" || value === "false"
            ? value === "true"
            : value,
    }));
  };

  const handleImageChange = (file) => {
    if (file && file.type.startsWith("image/")) {
      setFormData((prev) => ({
        ...prev,
        profileImage: file,
      }));

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      alert("Please select a valid image file");
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageChange(file);
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({
      ...prev,
      profileImage: null,
    }));
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      username: "",
      password: "",
      doj: "",
      dob: "",
      phone_number: "",
      emergency_number: "",
      department: "",
      role: "",
      emp_id: "",
      reference_name: "",
      email: "",
      notes: "",
      profileImage: null,
      is_head: false,
      is_pricing_specialist: false,
      is_active: true,
      company_id: "",
      work_id: "",
      only_profile: false,
    });
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validatePhoneNumber = (phone) => {
    const phoneStr = String(phone ?? "").trim();
    const phoneRegex = /^[0-9]{10}$/;

    return phoneRegex.test(phoneStr.replace(/\s/g, ""));
  };

  const handleSubmit = async () => {
    try {
      const newErrors = {};

      if (!formData.name.trim()) newErrors.name = "Full name is required";
      if (!formData.username.trim())
        newErrors.username = "Username is required";
      if (!userId && !formData.password.trim())
        newErrors.password = "Password is required";

      if (!formData.doj) {
        newErrors.doj = "Date of joining is required";
      } else {
        // Check if DOJ is not in the future
        const selectedDate = new Date(formData.doj);
        selectedDate.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate > today) {
          newErrors.doj = "Date of joining cannot be in the future";
        }
      }

      if (!formData.phone_number) {
        newErrors.phone_number = "Phone number is required";
      } else if (!validatePhoneNumber(formData.phone_number)) {
        newErrors.phone_number = "Please enter a valid phone number";
      }

      if (!formData.emergency_number) {
        newErrors.emergency_number = "Emergency number is required";
      } else if (!validatePhoneNumber(formData.emergency_number)) {
        newErrors.emergency_number = "Please enter a valid emergency number";
      }

      if (!formData.emp_id) {
        newErrors.emp_id = "Employee ID is required";
      }

      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }

      if (!formData.reference_name) {
        newErrors.reference_name = "Reference name is required";
      }

      if (!formData.dob) {
        newErrors.dob = "Date of birth is required";
      } else {
        const selectedDate = new Date(formData.dob);
        selectedDate.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // block today & future dates
        if (selectedDate >= today) {
          newErrors.dob = "Date of birth must be a past date";
        }

      }

      if (!formData.department)
        newErrors.department = "Please select a department";
      if (!formData.role) newErrors.role = "Please select a role";
      if (!formData.company_id) newErrors.company_id = "Please select a company";

      setErrors(newErrors);

      if (Object.keys(newErrors).length > 0) {
        return;
      }

      setIsLoading(true);

      const form = new FormData();
      form.append("name", formData.name);
      form.append("username", formData.username);
      if (formData.password) {
        form.append("password", formData.password);
      }
      form.append("doj", formatDateToDDMMYYYY(formData.doj));
      form.append("phone_number", formData.phone_number);
      form.append("emergency_number", formData.emergency_number);
      form.append("department_id", formData.department);
      form.append("role", formData.role);
      form.append("is_head", formData.is_head);
      form.append("is_pricing_specialist", formData.is_pricing_specialist);
      form.append("emp_id", formData.emp_id);
      form.append("email", formData.email);
      form.append("reference_name", formData.reference_name);
      form.append("dob", formatDateToDDMMYYYY(formData.dob));
      form.append("is_active", formData.is_active);
      form.append("company_id", formData.company_id);
      form.append("work_id", formData.work_id);
      form.append("only_profile", formData.only_profile);

      if (userRole?.toLowerCase() === "admin executive") {
        form.append("notes", formData.notes)
      }

      if (formData.profileImage) {
        form.append("image", formData.profileImage);
      } else if (!imagePreview) {
        form.append("image", "");
      }
      let response;

      if (userId) {
        response = await dispatch(
          updateUser({
            id: userId,
            formData: form,
          }),
        ).unwrap();
      } else {
        response = await dispatch(createUser(form)).unwrap();
      }
      if (response.id) {
        if (userId) {
          toast.success("User updated successfully");
        } else {
          toast.success("User added successfully");
        }

        if (isModal && onSuccess) {
          onSuccess();
          return;
        }
      }

      navigate(-1);
      setIsLoading(false);
    } catch (err) {
      console.log("Full Submission Error Object:", err);
      if (err.errors) {
        setErrors(prev => ({ ...prev, ...err.errors }));
      }
      // Ensure msg is a string for react-toastify
      const msg = err.message || (typeof err === 'string' ? err : "Submission failed");
      console.log("Toast Message being sent:", msg);
      toast.error(msg);
    }
    setIsLoading(false);
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const ProfileImageUpload = () => (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        {imagePreview ? (
          <div className="relative">
            <img
              src={imagePreview}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl ring-4 ring-blue-100"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-all duration-200 shadow-lg hover:scale-110"
              title="Remove image"
            >
              ×
            </button>
          </div>
        ) : (
          <div
            className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 border-4 border-white shadow-xl ring-4 ring-blue-100 flex items-center justify-center group cursor-pointer hover:shadow-2xl transition-all duration-300"
            onClick={() => fileInputRef.current?.click()}
          >
            {formData.name ? (
              <span className="text-3xl font-bold text-blue-600 select-none">
                {getInitials(formData.name)}
              </span>
            ) : (
              <svg
                className="w-12 h-12 text-blue-400 group-hover:text-blue-500 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md hover:shadow-lg"
      >
        {imagePreview ? "Change Photo" : "Upload Photo"}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );

  return (
    <div
      className={`bg-gray-100 font-sans ${isModal ? "p-0 bg-white" : "min-h-screen"}`}
      style={{ marginTop: isModal ? "0" : "40px", marginBottom: isModal ? "0" : "100px" }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {!isModal && (
            <div className="border-b border-gray-100 p-6 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-blue-600">
                {userId ? "Edit User" : "Create New User"}
              </h1>
              <button
                onClick={() => navigate(-1)}
                className="text-sm hover:bg-blue-200 text-blue-600 font-semibold py-2 px-4 rounded"
              >
                <KeyboardBackspaceIcon />
              </button>
            </div>
          )}

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <div>
                <ProfileImageUpload />
              </div>

              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={isModal}
                      className={`w-full px-4 py-2.5 rounded-lg border ${errors.username ? "border-red-500" : "border-gray-300"
                        } focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition ${isModal ? "bg-gray-100 cursor-not-allowed" : ""}`}
                      placeholder="Enter full name"
                    />
                    {errors.name && (
                      <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Username <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      disabled={isModal}
                      className={`w-full px-4 py-2.5 rounded-lg border ${errors.username ? "border-red-500" : "border-gray-300"
                        } focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition ${isModal ? "bg-gray-100 cursor-not-allowed" : ""}`}
                      placeholder="Enter username"
                    />
                    {errors.username && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.username}
                      </p>
                    )}
                  </div>
                </div>

                {!isModal && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Password <span className="text-red-600">*</span>
                    </label>

                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 pr-12 rounded-lg border ${errors.password ? "border-red-500" : "border-gray-300"
                          } focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition`}
                        placeholder={
                          userId
                            ? "Leave blank to keep current password"
                            : "Enter password"
                        }
                        {...(!userId && { required: true })}
                      />

                      {/* Eye icon imported from Material UI */}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                      >
                        {showPassword ? (
                          <VisibilityIcon
                            sx={{
                              fontSize: { xs: 16, sm: 16, md: 20, lg: 20 },
                            }}
                          />
                        ) : (
                          <VisibilityOffIcon
                            sx={{
                              fontSize: { xs: 16, sm: 16, md: 20, lg: 20 },
                            }}
                          />
                        )}
                      </button>
                    </div>

                    {errors.password && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.password}
                      </p>
                    )}
                  </div>
                )}

                {!isModal && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <FormControl fullWidth variant="outlined" size="small">
                        <label
                          className="block text-sm font-semibold text-gray-700 mb-2"
                          htmlFor="department-select"
                        >
                          Department <span className="text-red-600">*</span>
                        </label>

                        <Select
                          name="department"
                          id="department-select"
                          value={formData.department}
                          onChange={handleInputChange}
                          displayEmpty
                          size="small"
                        >
                          <MenuItem value="">
                            <span className="text-[var(--theme-text-muted)]">
                              Select Department
                            </span>
                          </MenuItem>

                          {departments.map((d) => (
                            <MenuItem key={d._id} value={d._id}>
                              {capitalizeFirst(d.name)} - {d.type}
                            </MenuItem>
                          ))}
                        </Select>

                        {errors.department && (
                          <p className="text-red-600 text-sm mt-1">
                            {errors.department}
                          </p>
                        )}
                      </FormControl>
                    </div>

                    <div>
                      <FormControl fullWidth variant="outlined" size="small">
                        <label
                          className="block text-sm font-semibold text-gray-700 mb-2"
                          htmlFor="role-select"
                        >
                          Role <span className="text-red-600">*</span>
                        </label>

                        <Select
                          name="role"
                          id="role-select"
                          value={formData.role}
                          onChange={handleInputChange}
                          displayEmpty
                          size="small"
                        >
                          <MenuItem value="">
                            <span className="text-[var(--theme-text-muted)]">
                              Select Role
                            </span>
                          </MenuItem>

                          {[...roles].sort((a, b) => a.name.localeCompare(b.name)).map((r) => (
                            <MenuItem key={r._id} value={r._id}>
                              {capitalizeFirst(r.name)}
                            </MenuItem>
                          ))}
                        </Select>

                        {errors.role && (
                          <p className="text-red-600 text-sm mt-1">
                            {errors.role}
                          </p>
                        )}
                      </FormControl>
                    </div>
                  </div>
                )}

                {!isModal && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <FormControl fullWidth variant="outlined" size="small">
                        <label
                          className="block text-sm font-semibold text-gray-700 mb-2"
                          htmlFor="is-head-select"
                        >
                          Is Head
                        </label>

                        <Select
                          name="is_head"
                          id="is-head-select"
                          value={formData.is_head}
                          onChange={handleInputChange}
                          displayEmpty
                          size="small"
                        >
                          <MenuItem value="">
                            <span className="text-[var(--theme-text-muted)]">
                              Select option
                            </span>
                          </MenuItem>
                          <MenuItem value={true}>Yes</MenuItem>
                          <MenuItem value={false}>No</MenuItem>
                        </Select>

                        {errors.is_head && (
                          <p className="text-red-600 text-sm mt-1">
                            {errors.is_head}
                          </p>
                        )}
                      </FormControl>
                    </div>

                    <FormControl fullWidth variant="outlined" size="small">
                      <label
                        className="block text-sm font-semibold text-gray-700 mb-2"
                        htmlFor="is-head-select"
                      >
                        Is Pricing Specialist
                      </label>

                      <Select
                        name="is_pricing_specialist"
                        id="is_pricing_specialist-select"
                        value={formData.is_pricing_specialist}
                        onChange={handleInputChange}
                        displayEmpty
                        size="small"
                      >
                        <MenuItem value="">
                          <span className="text-[var(--theme-text-muted)]">
                            Select option
                          </span>
                        </MenuItem>
                        <MenuItem value={true}>Yes</MenuItem>
                        <MenuItem value={false}>No</MenuItem>
                      </Select>

                      {errors.is_pricing_specialist && (
                        <p className="text-red-600 text-sm mt-1">
                          {errors.is_pricing_specialist}
                        </p>
                      )}
                    </FormControl>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <FormControl fullWidth variant="outlined" size="small">
                      <label
                        className="block text-sm font-semibold text-gray-700 mb-2"
                        htmlFor="company-select"
                      >
                        Company <span className="text-red-600">*</span>
                      </label>

                      <Select
                        name="company_id"
                        id="company-select"
                        value={formData.company_id}
                        onChange={handleInputChange}
                        displayEmpty
                        size="small"
                      >
                        <MenuItem value="">
                          <span className="text-[var(--theme-text-muted)]">
                            Select Company
                          </span>
                        </MenuItem>

                        {companiesList?.map((c) => (
                          <MenuItem key={c._id} value={c._id}>
                            {capitalizeFirst(c.company_name)}
                          </MenuItem>
                        ))}
                      </Select>

                      {errors.company_id && (
                        <p className="text-red-600 text-sm mt-1">
                          {errors.company_id}
                        </p>
                      )}
                    </FormControl>
                  </div>

                  <div>
                    <FormControl fullWidth variant="outlined" size="small">
                      <label
                        className="block text-sm font-semibold text-gray-700 mb-2"
                        htmlFor="work-select"
                      >
                        Work
                      </label>

                      <Select
                        name="work_id"
                        id="work-select"
                        value={formData.work_id}
                        onChange={handleInputChange}
                        displayEmpty
                        size="small"
                      >
                        <MenuItem value="">
                          <span className="text-[var(--theme-text-muted)]">
                            Select Work
                          </span>
                        </MenuItem>

                        {worksList?.map((w) => (
                          <MenuItem key={w._id} value={w._id}>
                            {capitalizeFirst(w.work_name)}
                          </MenuItem>
                        ))}
                      </Select>

                      {errors.work_id && (
                        <p className="text-red-600 text-sm mt-1">
                          {errors.work_id}
                        </p>
                      )}
                    </FormControl>
                  </div>

                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 rounded-lg border ${errors.email ? "border-red-500" : "border-gray-300"
                        } focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition`}
                      placeholder="Enter email"
                    />
                    {errors.email && (
                      <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Employee ID <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="tel"
                      name="emp_id"
                      value={formData.emp_id}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 rounded-lg border ${errors.emp_id
                        ? "border-red-500"
                        : "border-gray-300"
                        } focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition`}
                      placeholder="Enter employee id"
                    />
                    {errors.emp_id && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.emp_id}
                      </p>
                    )}
                  </div>



                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date of Joining <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="date"
                      name="doj"
                      value={formData.doj}
                      onChange={handleInputChange}
                      max={new Date().toISOString().split("T")[0]}
                      className={`w-full px-4 py-2.5 rounded-lg border ${errors.doj ? "border-red-500" : "border-gray-300"
                        } focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition`}
                    />
                    {errors.doj && (
                      <p className="text-red-600 text-sm mt-1">{errors.doj}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date of Birth <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleInputChange}
                      max={new Date().toISOString().split("T")[0]}
                      className={`w-full px-4 py-2.5 rounded-lg border ${errors.dob ? "border-red-500" : "border-gray-300"
                        } focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition`}
                    />
                    {errors.dob && (
                      <p className="text-red-600 text-sm mt-1">{errors.dob}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      maxLength={10}
                      className={`w-full px-4 py-2.5 rounded-lg border ${errors.phone_number
                        ? "border-red-500"
                        : "border-gray-300"
                        } focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition`}
                      placeholder="Enter phone number"
                    />
                    {errors.phone_number && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.phone_number}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Reference Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="name"
                      name="reference_name"
                      value={formData.reference_name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 rounded-lg border ${errors.reference_name
                        ? "border-red-500"
                        : "border-gray-300"
                        } focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition`}
                      placeholder="Enter reference name"
                    />
                    {errors.reference_name && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.reference_name}
                      </p>
                    )}
                  </div>

                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Emergency Number <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="tel"
                      name="emergency_number"
                      value={formData.emergency_number}
                      onChange={handleInputChange}
                      maxLength={10}
                      className={`w-full px-4 py-2.5 rounded-lg border ${errors.emergency_number
                        ? "border-red-500"
                        : "border-gray-300"
                        } focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition`}
                      placeholder="Enter emergency contact number"
                    />
                    {errors.emergency_number && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.emergency_number}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 mt-6 ml-2">
                    <input
                      type="checkbox"
                      id="only_profile"
                      name="only_profile"
                      checked={formData.only_profile}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor="only_profile"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Only Profile
                    </label>
                  </div>

                </div>
                {userRole?.toLowerCase() === "admin executive" && !isModal && (
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Notes
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                        style={{
                          resize: 'vertical',
                          minHeight: '100px',
                          maxHeight: '400px'
                        }}
                        placeholder="Enter notes"
                        rows={4}
                      ></textarea>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              {userId ? (
                <button
                  disabled={isLoading}
                  onClick={handleSubmit}
                  className={`px-6 py-2.5 primary-bgclr hover:bg-blue-600 text-white font-medium rounded-lg transition flex items-center ${isLoading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  style={{ backgroundColor: "#574fdd" }}
                >
                  {isLoading ? "Updating..." : "Update"}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleReset}
                    disabled={isLoading}
                    className={`px-5 py-2.5 bg-white border border-red-500 text-red-600 hover:bg-red-50 font-medium rounded-lg transition flex items-center ${isLoading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    type="button"
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className={`px-6 py-2.5 primary-bgclr hover:bg-blue-600 text-white font-medium rounded-lg transition flex items-center ${isLoading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    style={{ backgroundColor: "#574fdd" }}
                  >
                    {isLoading ? (
                      <svg
                        className="animate-spin w-4 h-4 mr-2 text-white"
                        xmlns="http://www.w3.org/2000/svg"
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
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        ></path>
                      </svg>
                    ) : (
                      <></>
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

export default UserForm;
