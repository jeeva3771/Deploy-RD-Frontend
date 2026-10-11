import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllUnits } from "../../reducer/unitReducer";
import { FormControl, Select, MenuItem } from "@mui/material";

export default function ClientDetails({
  handleNext,
  handleBack,
  formData,
  setFormData,
  sotype
}) {
  const dispatch = useDispatch();
  const [errors, setErrors] = useState({});
  const [unitValues, setUnitValues] = useState([]);
  const [emailInput, setEmailInput] = useState("");
  const [whatsappInput, setWhatsappInput] = useState("");

  const { units } = useSelector((state) => state.unit);

  useEffect(() => {
    dispatch(
      fetchAllUnits({
        is_active: true,
        order: "asc",
        sortField: "name",
      })
    );
  }, [dispatch]);

  useEffect(() => {
    if (!formData.unit) {
      setUnitValues([]);
      return;
    }
    const selected = units.find((u) => u.name === formData.unit);

    // FIX: filter out undefined, null, empty string
    const cleanValues = (selected?.values || []).filter(
      (v) => v && typeof v === "string" && v.trim() !== ""
    );

    setUnitValues(cleanValues);
  }, [formData.unit, units]);

  const setField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // EMAIL
  const handleAddEmail = () => {
    const email = emailInput.trim();

    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors((prev) => ({ ...prev, emails: "Enter a valid email" }));
      return;
    }

    if ((formData.emails || []).includes(email)) {
      setErrors((prev) => ({ ...prev, emails: "Email already added" }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      emails: [...(prev.emails || []), email],
    }));

    setEmailInput("");
    setErrors((prev) => ({ ...prev, emails: "" }));
  };

  const handleRemoveEmail = (index) => {
    setFormData((prev) => ({
      ...prev,
      emails: (prev.emails || []).filter((_, i) => i !== index),
    }));
  };

  // ---------------- WHATSAPP ----------------
  const handleAddWhatsapp = () => {
    const number = whatsappInput.trim();

    if (!/^\d{10}$/.test(number)) {
      setErrors((prev) => ({
        ...prev,
        whatsapp_numbers: "Enter valid 10-digit number",
      }));
      return;
    }

    if ((formData.whatsapp_numbers || []).includes(number)) {
      setErrors((prev) => ({
        ...prev,
        whatsapp_numbers: "This number is already added",
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      whatsapp_numbers: [...(prev.whatsapp_numbers || []), number],
    }));

    setWhatsappInput("");
    setErrors((prev) => ({ ...prev, whatsapp_numbers: "" }));
  };

  const handleRemoveWhatsapp = (index) => {
    setFormData((prev) => ({
      ...prev,
      whatsapp_numbers: (prev.whatsapp_numbers || []).filter(
        (_, i) => i !== index
      ),
    }));
  };

  // ---------------- VALIDATION ----------------
  const validateForm = () => {
    const newErrors = {};

    const requiredFields = [
      "clientName",
      "contactPerson",
      "phoneNumber",
      "billingAddress1",
      "city",
      "state",
      "postalCode",
      "productName",
    ];

    requiredFields.forEach((field) => {
      if (!formData[field]?.trim()) {
        newErrors[field] = "This field is required";
      }
    });

    if (sotype === "sample" || formData.sample_required === "Yes") {
      if (!formData.pricePerPiece?.trim()) {
        newErrors.pricePerPiece = "This field is required";
      }
    }

    if (!formData.unit) newErrors.unit = "Unit is required";


    if (sotype !== "sample") {
      if (!formData.sample_required) {
        newErrors.sample_required = "Sample required field is mandatory";
      }
    }

    if (!formData.phoneNumber || formData.phoneNumber.length !== 10) {
      newErrors.phoneNumber = "Phone number must be exactly 10 digits";
    }

    if ((formData.emails || []).length === 0)
      newErrors.emails = "At least one email required";

    if ((formData.whatsapp_numbers || []).length === 0)
      newErrors.whatsapp_numbers = "At least one WhatsApp number required";

    // --- PRODUCT SIZE VALIDATION (Only Height Mandatory) ---
    if (formData.unit) {
      const selectedUnit = units.find(
        (u) =>
          u.name.trim().toLowerCase() === formData.unit.trim().toLowerCase()
      );

      if (selectedUnit?.values?.length) {
        const normalizedValues = selectedUnit.values.map((v) =>
          v.trim().toLowerCase()
        );

        const hasHeightField = normalizedValues.includes("height");
        let missingHeight = false;

        if (hasHeightField) {
          const heightKey = selectedUnit.values.find(
            (v) => v.trim().toLowerCase() === "height"
          );

          if (!formData.product_size?.[heightKey]?.trim()) {
            missingHeight = true;
          }
        }

        if (missingHeight) {
          newErrors.product_size = "Height is required.";
        }
      }
    }

    // Postal Code Validation — must be exactly 6 digits
    if (!formData.postalCode || formData.postalCode.trim() === "") {
      newErrors.postalCode = "Postal code is required";
    } else if (!/^\d{6}$/.test(formData.postalCode)) {
      newErrors.postalCode = "Postal code must be exactly 6 digits";
    }

    // if (formData.gstNumber && formData.gstNumber.length !== 15) {
    //   newErrors.gstNumber = "GST number must be 15 characters in uppercase.";
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onNextClick = () => {
    // console.log("formData.unit uniittt:", formData.product_size);
    if (validateForm()) handleNext();
  };

  // Common input base class (light + dark)
 const baseInputClass =
    "w-full px-3 py-2 text-sm sm:text-base rounded-lg border " +
    "focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent " +
    "bg-white dark:bg-gray-800 border-gray-300";
 
  const chipClass =
    "px-3 py-1 rounded-full text-sm flex items-center " +
    "bg-gray-100 dark:bg-gray-700";

  return (
    <form className="flex flex-col gap-8">
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">
        Client Details
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Client Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Client Name <span className="text-red-500">*</span>
          </label>
          <input
            placeholder="Enter client name"
            value={formData.clientName || ""}
            onChange={(e) => setField("clientName", e.target.value)}
            className={baseInputClass}
          />
          {errors.clientName && (
            <span className="text-red-500 text-xs sm:text-sm mt-1 block">
              {errors.clientName}
            </span>
          )}
        </div>

        {/* Contact Person */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Contact Person <span className="text-red-500">*</span>
          </label>
          <input
            placeholder="Contact person name"
            value={formData.contactPerson || ""}
            onChange={(e) => setField("contactPerson", e.target.value)}
            className={baseInputClass}
          />
          {errors.contactPerson && (
            <span className="text-red-500 text-xs sm:text-sm mt-1 block">
              {errors.contactPerson}
            </span>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            placeholder="Enter phone number"
            value={formData.phoneNumber || ""}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*$/.test(value) && value.length <= 10) {
                setField("phoneNumber", e.target.value);
              }
            }}
            className={baseInputClass}
          />
          {errors.phoneNumber && (
            <span className="text-red-500 text-xs sm:text-sm mt-1 block">
              {errors.phoneNumber}
            </span>
          )}
        </div>

        {/* EMAIL */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Email <span className="text-red-500">*</span>
          </label>

          <div className="flex gap-2">
            <input
              placeholder="Enter email address"
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value);

                // clear email error instantly
                setErrors((prev) => ({ ...prev, emails: "" }));
              }}
              className={`${baseInputClass} border-gray-300 dark:border-gray-600 flex-1`}
            />
            <button
              type="button"
              onClick={handleAddEmail}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg text-sm sm:text-base"
            >
              Add
            </button>
          </div>

          {errors.emails && (
            <span className="text-red-500 text-xs sm:text-sm mt-1 block">
              {errors.emails}
            </span>
          )}

          {(formData.emails || []).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.emails.map((mail, idx) => (
                <div
                  key={idx}
                  className={chipClass}
                >
                  {mail}
                  <button
                    className="ml-2 text-red-600 dark:text-red-400"
                    onClick={() => handleRemoveEmail(idx)}
                    type="button"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WHATSAPP */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            WhatsApp Number <span className="text-red-500">*</span>
          </label>

          <div className="flex gap-2">
            <input
              placeholder="Enter WhatsApp number"
              maxLength={10}
              value={whatsappInput}
              onChange={(e) => {
                const value = e.target.value;

                if (/^\d*$/.test(value)) {
                  setWhatsappInput(value);

                  // clear Whatapp no. error instantly
                  setErrors((prev) => ({ ...prev, whatsapp_numbers: "" }));
                }
              }}
              className={`${baseInputClass} border-gray-300 dark:border-gray-600 flex-1`}
            />
            <button
              type="button"
              onClick={handleAddWhatsapp}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg text-sm sm:text-base"
            >
              Add
            </button>
          </div>

          {errors.whatsapp_numbers && (
            <span className="text-red-500 text-xs sm:text-sm mt-1 block">
              {errors.whatsapp_numbers}
            </span>
          )}

          {(formData.whatsapp_numbers || []).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.whatsapp_numbers.map((num, idx) => (
                <div
                  key={idx}
                  className={chipClass}
                >
                  {num}
                  <button
                    className="ml-2 text-red-600 dark:text-red-400"
                    onClick={() => handleRemoveWhatsapp(idx)}
                    type="button"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ADDRESS */}
      <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Billing Address</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Street Address <span className="text-red-500">*</span>
          </label>
          <input
            placeholder="Enter street address"
            value={formData.billingAddress1 || ""}
            onChange={(e) => setField("billingAddress1", e.target.value)}
            className={baseInputClass}
          />
          {errors.billingAddress1 && (
            <span className="text-red-500 text-xs sm:text-sm mt-1 block">
              {errors.billingAddress1}
            </span>
          )}
        </div>

        <div>
          <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">Street Line 2</label>
          <input
            placeholder="Optional"
            value={formData.billingAddress2 || ""}
            onChange={(e) => setField("billingAddress2", e.target.value)}
            className={`${baseInputClass} border-gray-300 dark:border-gray-600`}
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
            City <span className="text-red-500">*</span>
          </label>
          <input
            placeholder="Enter city"
            value={formData.city || ""}
            onChange={(e) => setField("city", e.target.value)}
            className={baseInputClass}
          />
          {errors.city && (
            <span className="text-red-500 text-xs sm:text-sm mt-1 block">
              {errors.city}
            </span>
          )}
        </div>

        <div>
          <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
            State <span className="text-red-500">*</span>
          </label>
          <input
            placeholder="Enter state"
            value={formData.state || ""}
            onChange={(e) => setField("state", e.target.value)}
            className={baseInputClass}
          />
          {errors.state && (
            <span className="text-red-500 text-xs sm:text-sm mt-1 block">
              {errors.state}
            </span>
          )}
        </div>

        <div>
          <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Postal Code <span className="text-red-500">*</span>
          </label>
          <input
            placeholder="Enter postal code"
            value={formData.postalCode || ""}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*$/.test(value) && value.length <= 6) {
                setField("postalCode", e.target.value);
              }
            }}
            className={baseInputClass}
          />
          {errors.postalCode && (
            <span className="text-red-500 text-xs sm:text-sm mt-1 block">
              {errors.postalCode}
            </span>
          )}
        </div>

        <div>
          <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">GST Number</label>
          <input
            placeholder="Enter GST No (optional)"
            value={formData.gstNumber || ""}
            onChange={(e) => {
              let val = e.target.value.toUpperCase();
              val = val.replace(/[^A-Z0-9]/g, ""); // block lowercase + special chars
              setField("gstNumber", val);
            }}
            className={`${baseInputClass} border-gray-300 dark:border-gray-600`}
          />
        </div>
      </div>

      {/* PRODUCT DETAILS */}
      <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Product Information</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            placeholder="Enter product name"
            value={formData.productName || ""}
            onChange={(e) => setField("productName", e.target.value)}
            className={baseInputClass}
          />
          {errors.productName && (
            <span className="text-red-500 text-xs sm:text-sm mt-1 block">
              {errors.productName}
            </span>
          )}
        </div>

        <div>
          <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Unit of Measurement <span className="text-red-500">*</span>
          </label>
          <FormControl fullWidth size="small">
            <Select
              value={formData.unit || ""}
              displayEmpty
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  unit: e.target.value,
                  product_size: {},
                }));
                // Clear product size error instantly when unit changes
                setErrors((prev) => ({ ...prev, product_size: "" }));
              }}
            >
              <MenuItem value="">
                <span className="text-gray-400">Select Unit</span>
              </MenuItem>

              {units.map((u) => (
                <MenuItem key={u._id} value={u.name}>
                  {u.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {errors.unit && (
            <span className="text-red-500 text-xs sm:text-sm mt-1 block">
              {errors.unit}
            </span>
          )}
        </div>
      </div>

      {formData.unit && (
        //PRODUCT SIZE INPUTS (Height -Mandatory)
        <>
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">Product Size</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {unitValues.map((param) => {
              const isHeight = param.trim().toLowerCase() === "height";

              return (
                <div key={param} className="flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {param}
                    {isHeight && <span className="text-red-500 ml-1">*</span>}
                  </label>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={formData.product_size?.[param] || ""}
                    onChange={(e) => {
                      if (!param) return; // prevent undefined key creation

                      const numericValue = e.target.value.replace(
                        /[^0-9.]/g,
                        ""
                      );
                      const cleanedValue = numericValue.replace(
                        /(\..*?)\..*/g,
                        "$1"
                      );

                      setFormData((prev) => ({
                        ...prev,
                        product_size: {
                          ...prev.product_size,
                          [param]: cleanedValue,
                        },
                      }));
                      // clear height error
                      setErrors((prev) => ({ ...prev, product_size: "" }));
                    }}
                    className={`${baseInputClass} border-gray-300 dark:border-gray-600`}
                    placeholder={`Enter ${param}`}
                    required={isHeight}
                  />

                  {/* Show error ONLY for Height field */}
                  {isHeight && errors.product_size && (
                    <span className="text-red-500 text-xs sm:text-sm block">
                      {errors.product_size}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}


       {sotype !== "sample" && (
         <div>
          <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Sample Required <span className="text-red-500">*</span>
            </label>

          <FormControl fullWidth size="small">
            <Select
              value={formData.sample_required || ""}
              displayEmpty
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  sample_required: e.target.value, // <-- FIXED
                }));

                setErrors((prev) => ({ ...prev, sample_required: "" }));
              }}
            >
              <MenuItem value="">
                <span className="text-gray-400">Select Yes or No</span>
              </MenuItem>

              {/* Only Yes or No Options */}
              <MenuItem value="Yes">Yes</MenuItem>
              <MenuItem value="No">No</MenuItem>
            </Select>
          </FormControl>

          {errors.sample_required && (
            <span className="text-red-500 text-xs sm:text-sm mt-1 block">
              {errors.sample_required}
            </span>
          )}
        </div>
                )}
      {(sotype === "sample" ||  formData.sample_required === "Yes") && (
      <div>
        <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {sotype === "sample" ? "Sample Price Per Piece" : "Price Per Piece"} <span className="text-red-500">*</span>
        </label>
        <input
          placeholder="Enter sample price"
          type="text"
          value={formData.pricePerPiece || ""}
          onChange={(e) => {
            let val = e.target.value;

           // Allow only digits
            val = val.replace(/[^0-9]/g, "");
 
            // Block 0 as the first digit
            if (val.startsWith("0")) {
              val = val.replace(/^0+/, "");
            }

            setField("pricePerPiece", val);
          }}
          className={baseInputClass}
        />
        {errors.pricePerPiece && (
          <span className="text-red-500 text-xs sm:text-sm mt-1 block">
            {errors.pricePerPiece}
          </span>
        )}
      </div>
      )}

      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={handleBack}
          className="px-4 py-2 border rounded-md text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600"
        >
          Back
        </button>

        <button
          type="button"
          onClick={onNextClick}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
        >
          Next
        </button>
      </div>
    </form>
  );
}
