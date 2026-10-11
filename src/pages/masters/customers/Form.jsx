import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCustomerById,
  createCustomer,
  updateCustomer,
  clearSelectedCustomer,
} from "../../../reducer/customerReducer";
import axios from "axios";
import { axiosInstance, backendUrl } from "../../../utils/url/config";
import { toast } from "react-toastify";
import { useLoader } from "../../../context/LoaderContext";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

const CustomerForm = () => {
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoader();
  const { customerId } = useParams();
  const dispatch = useDispatch();

  const { selectedCustomer, loading } = useSelector((state) => state.customer);

  const [formData, setFormData] = useState({
    clientName: "",
    contactPerson: "",
    phoneNumber: "",
    email: "",
    addresses: [
      {
        streetAddress: "",
        streetAddress2: "",
        city: "",
        state: "",
        postalCode: "",
        gstNumber: "",
      },
    ],
    status: null,
  });

  const [fieldErrors, setFieldErrors] = useState({
    clientName: "",
    contactPerson: "",
    phoneNumber: "",
    email: "",
    status: "",
    addresses: [],
  });

  // Fetch customer data when editing
  useEffect(() => {
    if (customerId) {
      const fetchData = async () => {
        try {
          await dispatch(fetchCustomerById(customerId)).unwrap();
        } catch (error) {
          toast.error(error?.message || "Failed to load customer data");
        }
      };
      fetchData();
    }

    return () => {
      dispatch(clearSelectedCustomer());
    };
  }, [customerId, dispatch]);

  // Populate form when selectedCustomer is loaded
  useEffect(() => {
    if (selectedCustomer && customerId) {
      setFormData({
        clientName: selectedCustomer.name || "",
        contactPerson: selectedCustomer.contact_person || "",
        phoneNumber: selectedCustomer.mobile_no || "",
        email: selectedCustomer.email || "",
        addresses:
          selectedCustomer.address?.map((addr) => ({
            streetAddress: addr.address_1,
            streetAddress2: addr.address_2,
            city: addr.city,
            state: addr.state,
            postalCode: addr.postal_code,
            gstNumber: addr.gst_no,
          })) || [],
        status: selectedCustomer.is_active,
      });
    }
  }, [selectedCustomer, customerId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => {
      if (name === "status") {
        return { ...prev, status: value === "active" };
      }

      if (name === "phoneNumber") {
        const numericValue = value.replace(/\D/g, "").slice(0, 10);
        return { ...prev, [name]: numericValue };
      }

      return {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };
    });

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleAddressChange = (index, e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = [...prev.addresses];

      if (name === "postalCode") {
        updated[index][name] = value.replace(/\D/g, "").slice(0, 6);
      } else {
        updated[index][name] = value;
      }

      return { ...prev, addresses: updated };
    });

    if (fieldErrors.addresses?.[index]?.[name]) {
      setFieldErrors((prev) => {
        const updatedAddressErrors = [...prev.addresses];
        if (updatedAddressErrors[index]) {
          updatedAddressErrors[index] = {
            ...updatedAddressErrors[index],
            [name]: "",
          };
        }
        return { ...prev, addresses: updatedAddressErrors };
      });
    }
  };

  const addBillingAddress = () => {
    setFormData((prev) => ({
      ...prev,
      addresses: [
        ...prev.addresses,
        {
          streetAddress: "",
          streetAddress2: "",
          city: "",
          state: "",
          postalCode: "",
          gstNumber: "",
        },
      ],
    }));
  };

  const removeBillingAddress = (index) => {
    setFormData((prev) => ({
      ...prev,
      addresses: prev.addresses.filter((_, i) => i !== index),
    }));
    setFieldErrors((prev) => ({
      ...prev,
      addresses: prev.addresses.filter((_, i) => i !== index),
    }));
  };

  const handleReset = () => {
    setFormData({
      clientName: "",
      contactPerson: "",
      phoneNumber: "",
      email: "",
      addresses: [
        {
          streetAddress: "",
          streetAddress2: "",
          city: "",
          state: "",
          postalCode: "",
          gstNumber: "",
        },
      ],
      status: null,
    });
    setFieldErrors({
      clientName: "",
      contactPerson: "",
      phoneNumber: "",
      email: "",
      status: "",
      addresses: [],
    });
  };

  const handleSubmit = async () => {
    const newErrors = {
      clientName: "",
      contactPerson: "",
      phoneNumber: "",
      email: "",
      status: "",
      addresses: formData.addresses.map(() => ({
        streetAddress: "",
        city: "",
        state: "",
        postalCode: "",
      })),
    };

    let hasError = false;

    if (!formData.clientName.trim()) {
      newErrors.clientName = "Client Name is required";
      hasError = true;
    }

    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = "Contact Person is required";
      hasError = true;
    }

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = "Phone Number is required";
      hasError = true;
    } else {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(formData.phoneNumber)) {
        newErrors.phoneNumber = "Phone Number must be exactly 10 digits";
        hasError = true;
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      hasError = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Invalid email format";
        hasError = true;
      }
    }

    if (formData.status === null || formData.status === "") {
      newErrors.status = "Status is required";
      hasError = true;
    }

    formData.addresses.forEach((address, index) => {
      if (!address.streetAddress.trim()) {
        newErrors.addresses[index].streetAddress = "Street Address is required";
        hasError = true;
      }

      if (!address.city.trim()) {
        newErrors.addresses[index].city = "City is required";
        hasError = true;
      }

      if (!address.state.trim()) {
        newErrors.addresses[index].state = "State is required";
        hasError = true;
      }

      if (!address.postalCode.trim()) {
        newErrors.addresses[index].postalCode = "Postal Code is required";
        hasError = true;
      } else if (!/^[0-9]{6}$/.test(address.postalCode)) {
        newErrors.addresses[index].postalCode =
          "Postal Code must be exactly 6 digits";
        hasError = true;
      }
    });

    setFieldErrors(newErrors);

    if (hasError) {
      toast.error("Please fix the highlighted errors");
      return;
    }

    const payload = {
      name: formData.clientName,
      contact_person: formData.contactPerson,
      mobile_no: Number(formData.phoneNumber),
      email: formData.email,
      address: formData.addresses.map((a) => ({
        address_1: a.streetAddress,
        address_2: a.streetAddress2,
        city: a.city,
        state: a.state,
        postal_code: a.postalCode,
        gst_no: a.gstNumber,
      })),
      is_active: formData.status,
    };

    try {
      if (customerId) {
        await dispatch(
          updateCustomer({ id: customerId, formData: payload })
        ).unwrap();
        toast.success("Customer updated successfully");
      } else {
        await dispatch(createCustomer(payload)).unwrap();
        toast.success("Customer created successfully");
      }
      navigate("/customer");
    } catch (err) {
      const errorMessage = err?.message || "Something went wrong";
      toast.error(errorMessage);
    }
  };

  return (
    <div
      className="bg-gray-100 font-sans min-h-screen form-display"
      style={{ marginTop: "80px" }}
    >
      <div className="form-display flex items-center justify-center p-4">
        <div className="w-full max-w-6xl bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 p-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">
              {customerId ? "Edit Customer" : "Create Customer"}
            </h1>
            <button
              onClick={() => navigate(-1)}
              className="text-sm hover:bg-blue-200 text-blue-600 font-semibold py-2 px-4 rounded"
            >
              <KeyboardBackspaceIcon />
            </button>
          </div>

          <div className="p-6">
            {/* Basic Information Section */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b-2 border-gray-200">
                <i className="fa fa-user mr-2"></i>
                Basic Information
              </h2>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-2"
                      htmlFor="clientName"
                    >
                      Client Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="clientName"
                      id="clientName"
                      value={formData.clientName}
                      onChange={handleChange}
                      placeholder="Enter client name"
                      className={`w-full px-4 py-2.5 rounded-lg border ${fieldErrors.clientName
                          ? "border-red-500 focus:ring-red-300 focus:border-red-500"
                          : "border-gray-300 focus:ring-blue-300 focus:border-blue-500"
                        } focus:ring-2 outline-none transition`}
                    />
                    {fieldErrors.clientName && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors.clientName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-2"
                      htmlFor="contactPerson"
                    >
                      Contact Person <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="contactPerson"
                      id="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleChange}
                      placeholder="Enter contact person name"
                      className={`w-full px-4 py-2.5 rounded-lg border ${fieldErrors.contactPerson
                          ? "border-red-500 focus:ring-red-300 focus:border-red-500"
                          : "border-gray-300 focus:ring-blue-300 focus:border-blue-500"
                        } focus:ring-2 outline-none transition`}
                    />
                    {fieldErrors.contactPerson && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors.contactPerson}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-2"
                      htmlFor="phoneNumber"
                    >
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      id="phoneNumber"
                      maxLength={10}
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      placeholder="+1 (555) 123-4567"
                      className={`w-full px-4 py-2.5 rounded-lg border ${fieldErrors.phoneNumber
                          ? "border-red-500 focus:ring-red-300 focus:border-red-500"
                          : "border-gray-300 focus:ring-blue-300 focus:border-blue-500"
                        } focus:ring-2 outline-none transition`}
                    />
                    {fieldErrors.phoneNumber && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors.phoneNumber}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-2"
                      htmlFor="email"
                    >
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="client@company.com"
                      className={`w-full px-4 py-2.5 rounded-lg border ${fieldErrors.email
                          ? "border-red-500 focus:ring-red-300 focus:border-red-500"
                          : "border-gray-300 focus:ring-blue-300 focus:border-blue-500"
                        } focus:ring-2 outline-none transition`}
                    />
                    {fieldErrors.email && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <FormControl fullWidth variant="outlined" size="small">
                      <label
                        className="block text-sm font-semibold text-gray-700 mb-2"
                        htmlFor="status"
                      >
                        Status <span className="text-red-600">*</span>
                      </label>

                      <Select
                        id="status"
                        name="status"
                        value={
                          formData.status === null
                            ? ""
                            : formData.status
                              ? "active"
                              : "inactive"
                        }
                        onChange={handleChange}
                        displayEmpty
                        size="small"
                        className={`${fieldErrors.status ? "border-red-500" : ""
                          }`}
                      >
                        <MenuItem value="">
                          <span className="text-[var(--theme-text-muted)]">
                            Select status
                          </span>
                        </MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                      </Select>

                      {fieldErrors.status && (
                        <p className="mt-1 text-sm text-red-600">
                          {fieldErrors.status}
                        </p>
                      )}
                    </FormControl>
                  </div>
                </div>
              </div>
            </div>

            {/* Billing Address Section */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b-2 border-gray-200">
                <i className="fa fa-building mr-2"></i>
                Address
              </h2>
              <div className="p-6">
                {formData.addresses.map((address, index) => (
                  <div key={index} className="p-4 mb-4 rounded-md bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Street Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="streetAddress"
                          value={address.streetAddress}
                          onChange={(e) => handleAddressChange(index, e)}
                          placeholder="123 Main Street"
                          className={`w-full px-4 py-2.5 rounded-lg border ${fieldErrors.addresses[index]?.streetAddress
                              ? "border-red-500 focus:ring-red-300 focus:border-red-500"
                              : "border-gray-300 focus:ring-blue-300 focus:border-blue-500"
                            } focus:ring-2 outline-none transition`}
                        />
                        {fieldErrors.addresses[index]?.streetAddress && (
                          <p className="mt-1 text-sm text-red-600">
                            {fieldErrors.addresses[index].streetAddress}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Street Address 2
                        </label>
                        <input
                          type="text"
                          name="streetAddress2"
                          value={address.streetAddress2}
                          onChange={(e) => handleAddressChange(index, e)}
                          placeholder="Apartment, suite, unit, etc."
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={address.city}
                          onChange={(e) => handleAddressChange(index, e)}
                          placeholder="New York"
                          className={`w-full px-4 py-2.5 rounded-lg border ${fieldErrors.addresses[index]?.city
                              ? "border-red-500 focus:ring-red-300 focus:border-red-500"
                              : "border-gray-300 focus:ring-blue-300 focus:border-blue-500"
                            } focus:ring-2 outline-none transition`}
                        />
                        {fieldErrors.addresses[index]?.city && (
                          <p className="mt-1 text-sm text-red-600">
                            {fieldErrors.addresses[index].city}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="state"
                          value={address.state}
                          onChange={(e) => handleAddressChange(index, e)}
                          placeholder="NY"
                          className={`w-full px-4 py-2.5 rounded-lg border ${fieldErrors.addresses[index]?.state
                              ? "border-red-500 focus:ring-red-300 focus:border-red-500"
                              : "border-gray-300 focus:ring-blue-300 focus:border-blue-500"
                            } focus:ring-2 outline-none transition`}
                        />
                        {fieldErrors.addresses[index]?.state && (
                          <p className="mt-1 text-sm text-red-600">
                            {fieldErrors.addresses[index].state}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Postal Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          name="postalCode"
                          maxLength={6}
                          value={address.postalCode}
                          onChange={(e) => handleAddressChange(index, e)}
                          placeholder="100010"
                          className={`w-full px-4 py-2.5 rounded-lg border ${fieldErrors.addresses[index]?.postalCode
                              ? "border-red-500 focus:ring-red-300 focus:border-red-500"
                              : "border-gray-300 focus:ring-blue-300 focus:border-blue-500"
                            } focus:ring-2 outline-none transition`}
                        />
                        {fieldErrors.addresses[index]?.postalCode && (
                          <p className="mt-1 text-sm text-red-600">
                            {fieldErrors.addresses[index].postalCode}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          GST Number
                        </label>
                        <input
                          type="text"
                          name="gstNumber"
                          value={address.gstNumber}
                          onChange={(e) => handleAddressChange(index, e)}
                          placeholder="27AAECS1234F1Z5"
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                      {index === formData.addresses.length - 1 && (
                        <button
                          type="button"
                          onClick={addBillingAddress}
                          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                        >
                          + Add Another
                        </button>
                      )}
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removeBillingAddress(index)}
                          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              {customerId ? (
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
                    className="px-5 py-2.5 bg-white border border-red-500 text-red-500 hover:bg-red-50 font-medium rounded-lg transition flex items-center"
                    type="button"
                    disabled={loading}
                    onClick={handleReset}
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

export default CustomerForm;
