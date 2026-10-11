import React, { useEffect, useState } from "react";
import { FormControl, Select, MenuItem, TextField } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchDeliveryModes,
  fetchDeliveryTypes,
  fetchWhoWillPay,
} from "../../reducer/commonReducer";

export default function DeliveryDetails({
  handleNext,
  handleBack,
  formData,
  setFormData,
}) {
  const [localData, setLocalData] = useState({
    deliveryDate: formData.deliveryDate || "",
    deliveryType: formData.deliveryType || "",
    deliveryMode: formData.deliveryMode || "",
    whoWillPay: formData.whoWillPay || "",
    deliveryLocation: formData.deliveryLocation || "",
    courierAmount: formData.courierAmount || "",
    addInInvoice: formData.addInInvoice || false,
  });

  const [customDeliveryMode, setCustomDeliveryMode] = useState(
    formData.customDeliveryMode || ""
  );

  const [multiDeliveries, setMultiDeliveries] = useState(
    formData.multiDeliveries || []
  );

  const [errors, setErrors] = useState({});

  const dispatch = useDispatch();

  const {
    deliveryModes,
    loadingDeliveryModes,
    deliveryTypes,
    loadingDeliveryTypes,
    whoWillPayOptions,
    loadingWhoWillPay,
  } = useSelector((state) => state.commondropdowns);

  useEffect(() => {
    dispatch(fetchDeliveryModes());
    dispatch(fetchDeliveryTypes());
    dispatch(fetchWhoWillPay());
  }, [dispatch]);

  const handleChange = (e) => {
    let { name, value } = e.target;



    // Update local UI
    setLocalData((prev) => ({ ...prev, [name]: value }));

    // Update parent saved data
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleMultiChange = (index, field, value) => {
    const updated = [...multiDeliveries];

    if (field === 'contactNumber') {
      value = value.replace(/\D/g, '').slice(0, 10);
    }



    if (field === 'quantity') {
      if (Number(value) < 0) return;
      if (value.startsWith('0')) value = value.replace(/^0+/, '');
    }

    updated[index][field] = value;
    if (field === 'deliveryMode' && value === 'Client Pickup') {
      updated[index].whoWillPay = '';
    }
    setMultiDeliveries(updated);
    setFormData((prev) => ({ ...prev, multiDeliveries: updated }));

    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`multi_${index}_${field}`];
      if (field === 'quantity') {
        delete newErrors.multiDeliveries;
      }
      return newErrors;
    });
  };

  const addMultiDelivery = () => {
    const newDelivery = { contactName: '', contactNumber: '', quantity: '', deliveryMode: '', customDeliveryMode: '', whoWillPay: '', deliveryLocation: '', courierAmount: '', addInInvoice: false };
    const updated = [...multiDeliveries, newDelivery];
    setMultiDeliveries(updated);
    setFormData((prev) => ({ ...prev, multiDeliveries: updated }));
  };

  const removeMultiDelivery = (index) => {
    const updated = multiDeliveries.filter((_, i) => i !== index);
    setMultiDeliveries(updated);
    setFormData((prev) => ({ ...prev, multiDeliveries: updated }));
  };

  const validateForm = () => {
    let newErrors = {};

    if (!localData.deliveryDate)
      newErrors.deliveryDate = "Please select delivery date";

    // Delivery date validation
    if (localData.deliveryDate) {
      const deliveryDate = new Date(localData.deliveryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Past date not allowed
      if (deliveryDate < today) {
        newErrors.deliveryDate = "Delivery date cannot be in the past";
      }

      // Compare with job completion date (from formData)
      if (formData.completionDate) {
        const jobDate = new Date(formData.completionDate);
        jobDate.setHours(0, 0, 0, 0);

        if (deliveryDate < jobDate) {
          newErrors.deliveryDate =
            "Delivery date cannot be before job completion date";
        }
      }
    }

    if (!localData.deliveryType)
      newErrors.deliveryType = "Please select delivery type";

    if (localData.deliveryType?.toLowerCase().includes("multi")) {
      if (multiDeliveries.length === 0) {
        newErrors.multiDeliveries = "Please add at least one delivery point";
      } else {
        const totalQuantity = multiDeliveries.reduce((sum, del) => sum + (Number(del.quantity) || 0), 0);
        if (formData.jobQty && totalQuantity !== Number(formData.jobQty)) {
          newErrors.multiDeliveries = `Total split quantity (${totalQuantity}) must be exactly equal to Job Quantity (${formData.jobQty})`;
        }

        multiDeliveries.forEach((delivery, index) => {
          if (!delivery.contactName) {
            newErrors[`multi_${index}_contactName`] = "Please enter contact name";
          }
          if (!delivery.contactNumber) {
            newErrors[`multi_${index}_contactNumber`] = "Please enter contact number";
          } else if (!/^\d{10}$/.test(delivery.contactNumber)) {
            newErrors[`multi_${index}_contactNumber`] = "Contact number must be exactly 10 digits";
          }
          if (!delivery.quantity) {
            newErrors[`multi_${index}_quantity`] = "Please enter quantity";
          }
          if (!delivery.deliveryMode) {
            newErrors[`multi_${index}_deliveryMode`] = "Please select delivery mode";
          }
          if ((delivery.deliveryMode === "Break" || delivery.deliveryMode === "Hand Delivery + Courier") && !(delivery.customDeliveryMode || "").trim()) {
            newErrors[`multi_${index}_customDeliveryMode`] = `Details required for "${delivery.deliveryMode}"`;
          }
          if (!delivery.whoWillPay && delivery.deliveryMode !== "Client Pickup") {
            newErrors[`multi_${index}_whoWillPay`] = "Please select payer";
          } else if (delivery.whoWillPay === "RD Courier") {
            if (!delivery.courierAmount) {
              newErrors[`multi_${index}_courierAmount`] = "Please select amount option";
            }
          }
          if (!delivery.deliveryLocation) {
            newErrors[`multi_${index}_deliveryLocation`] = "Please enter delivery location";
          }
        });
      }
    } else {
      if (!localData.deliveryMode)
        newErrors.deliveryMode = "Please select delivery mode";

      if (
        localData.deliveryMode === "Break" ||
        localData.deliveryMode === "Hand Delivery + Courier"
      ) {
        if (!customDeliveryMode.trim()) {
          newErrors.customDeliveryMode = `Details required for "${localData.deliveryMode}"`;
        }
      }

      if (!localData.whoWillPay && localData.deliveryMode !== "Client Pickup") {
        newErrors.whoWillPay = "Please select payer";
      } else if (localData.whoWillPay === "RD Courier") {
        if (!localData.courierAmount) {
          newErrors.courierAmount = "Please select amount option";
        }
      }

      if (!localData.deliveryLocation)
        newErrors.deliveryLocation = "Please enter delivery location";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // const onNextClick = () => {
  //   if (validateForm()) handleNext(localData);
  // };

  const onNextClick = () => {
    if (validateForm()) {
      handleNext({
        ...localData,
        customDeliveryMode: customDeliveryMode || "",
        multiDeliveries: localData.deliveryType?.toLowerCase().includes("multi") ? multiDeliveries : [],
      });
    }
  };

  return (
    <form className="flex flex-col gap-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">
        Delivery Details
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Delivery Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Delivery Date <span className="text-red-600">*</span>
          </label>
          <input
            type="date"
            name="deliveryDate"
            value={localData.deliveryDate}
            onChange={handleChange}
            min={new Date().toISOString().split("T")[0]} // no past dates allowed
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
          {errors.deliveryDate && (
            <span className="text-red-500 text-xs sm:text-sm mt-1 block">
              {errors.deliveryDate}
            </span>
          )}
        </div>

        {/* Delivery Type */}
        <FormControl fullWidth variant="outlined" size="small">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Delivery Type <span className="text-red-600">*</span>
          </label>

          <Select
            name="deliveryType"
            value={localData.deliveryType}
            onChange={handleChange}
            displayEmpty
            size="small"
            error={!!errors.deliveryType}
          >
            <MenuItem value="">
              <span className="text-gray-500">Select Delivery Type</span>
            </MenuItem>

            {deliveryTypes.map((type) => (
              <MenuItem key={type._id} value={type.name}>
                {type.name}
              </MenuItem>
            ))}
          </Select>

          {errors.deliveryType && (
            <p className="text-red-600 text-sm mt-1">{errors.deliveryType}</p>
          )}
        </FormControl>
      </div>

      {!localData.deliveryType?.toLowerCase().includes("multi") ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Delivery Mode */}
            <FormControl fullWidth size="small" error={!!errors.deliveryMode}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Delivery Mode <span className="text-red-600">*</span>
              </label>

              <Select
                name="deliveryMode"
                value={localData.deliveryMode}
                onChange={(e) => {
                  handleChange(e);

                  const value = e.target.value;
                  if (
                    value !== "Break" &&
                    value !== "Hand Delivery + Courier"
                  ) {
                    setCustomDeliveryMode("");
                  }

                  // Clear and disable 'Who Will Pay' if Client Pickup
                  if (value === "Client Pickup") {
                    setLocalData((prev) => ({ ...prev, whoWillPay: "" }));
                    setFormData((prev) => ({ ...prev, whoWillPay: "" }));
                  }
                }}
                displayEmpty
                disabled={loadingDeliveryModes}
              >
                <MenuItem value="">
                  <span className="text-gray-500">Select delivery mode</span>
                </MenuItem>

                {loadingDeliveryModes ? (
                  <MenuItem disabled>Loading...</MenuItem>
                ) : (
                  deliveryModes
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((mode) => (
                      <MenuItem key={mode._id} value={mode.name}>
                        {mode.name}
                      </MenuItem>
                    ))
                )}
              </Select>

              {/* Show custom input */}
              {(localData.deliveryMode === "Break" ||
                localData.deliveryMode === "Hand Delivery + Courier") && (
                  <input
                    type="text"
                    value={customDeliveryMode}
                    onChange={(e) => setCustomDeliveryMode(e.target.value)}
                    placeholder={`Enter details for "${localData.deliveryMode}"`}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded"
                  />
                )}

              {errors.deliveryMode && (
                <span className="text-red-500 text-sm">{errors.deliveryMode}</span>
              )}

              {errors.customDeliveryMode && (
                <span className="text-red-500 text-sm">
                  {errors.customDeliveryMode}
                </span>
              )}
            </FormControl>

            {/* Who Will Pay */}
            <FormControl fullWidth variant="outlined" size="small">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Who Will Pay {localData.deliveryMode !== "Client Pickup" && <span className="text-red-600">*</span>}
              </label>

              <Select
                name="whoWillPay"
                value={localData.whoWillPay}
                onChange={handleChange}
                disabled={localData.deliveryMode === "Client Pickup"}
                displayEmpty
                size="small"
                error={!!errors.whoWillPay}
              >
                <MenuItem value="">
                  <span className="text-gray-500">Select Who Will Pay</span>
                </MenuItem>

                {whoWillPayOptions.map((opt) => (
                  <MenuItem key={opt._id} value={opt.name}>
                    {opt.name}
                  </MenuItem>
                ))}
              </Select>

              {errors.whoWillPay && (
                <span className="text-red-600 text-sm mt-1">
                  {errors.whoWillPay}
                </span>
              )}

              {localData.whoWillPay === "RD Courier" && (
                <div className="mt-3 flex gap-4 items-center bg-gray-50 p-2 rounded border border-gray-200">
                  <div className="flex-1">
                    <Select
                      name="courierAmount"
                      value={localData.courierAmount || ''}
                      onChange={handleChange}
                      displayEmpty
                      size="small"
                      error={!!errors.courierAmount}
                      className="w-full bg-white text-sm"
                      sx={{ height: '36px' }}
                    >
                      <MenuItem value="">
                        <span className="text-gray-500">Select Amount Option</span>
                      </MenuItem>
                      <MenuItem value="50% RD">50% RD</MenuItem>
                      <MenuItem value="100% RD">100% RD</MenuItem>
                    </Select>
                    {errors.courierAmount && (
                      <span className="text-red-500 text-xs mt-1 block">{errors.courierAmount}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="checkbox"
                      id="addInInvoice"
                      name="addInInvoice"
                      checked={localData.addInInvoice}
                      onChange={(e) => {
                        setLocalData((prev) => ({ ...prev, addInInvoice: e.target.checked }));
                        setFormData((prev) => ({ ...prev, addInInvoice: e.target.checked }));
                      }}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300"
                    />
                    <label htmlFor="addInInvoice" className="text-sm font-semibold text-gray-700">Add to Invoice</label>
                  </div>
                </div>
              )}
            </FormControl>
          </div>

          {/* Delivery Location */}
          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Delivery Location <span className="text-red-600">*</span>
            </label>

            <textarea
              name="deliveryLocation"
              value={localData.deliveryLocation}
              onChange={handleChange}
              placeholder="Enter delivery location"
              rows={3}
              className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.deliveryLocation ? "border-red-500" : "border-gray-300"
                }`}
            ></textarea>

            {errors.deliveryLocation && (
              <p className="text-red-600 text-sm mt-1">{errors.deliveryLocation}</p>
            )}
          </div>
        </>
      ) : (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-semibold text-gray-700">
              Multi-Point Deliveries
              {formData.jobQty && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 py-1 px-2 rounded-full">
                  Job Quantity: {formData.jobQty}
                </span>
              )}
            </label>
            {/* <button type="button" className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded font-semibold hover:bg-green-100 flex items-center gap-1 transition-colors">
              <span>📊</span> Import Delivery Excel
            </button> */}
          </div>

          {multiDeliveries.map((delivery, index) => (
            <div key={index} className="border border-gray-200 p-5 rounded-xl mb-4 bg-gray-50/50 relative shadow-sm">
              <button
                type="button"
                onClick={() => removeMultiDelivery(index)}
                className="absolute top-3 right-4 text-red-500 hover:text-red-700 text-sm font-semibold bg-red-50 px-2 py-1 rounded"
              >
                Remove
              </button>

              <h3 className="font-bold text-gray-800 mb-4 text-sm">Delivery Point {index + 1}</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Contact Person Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none ${errors[`multi_${index}_contactName`] ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter name"
                    value={delivery.contactName}
                    onChange={(e) => handleMultiChange(index, 'contactName', e.target.value)}
                  />
                  {errors[`multi_${index}_contactName`] && (
                    <span className="text-red-500 text-xs mt-1">{errors[`multi_${index}_contactName`]}</span>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Contact Number <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none ${errors[`multi_${index}_contactNumber`] ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter phone"
                    value={delivery.contactNumber}
                    onChange={(e) => handleMultiChange(index, 'contactNumber', e.target.value)}
                  />
                  {errors[`multi_${index}_contactNumber`] && (
                    <span className="text-red-500 text-xs mt-1">{errors[`multi_${index}_contactNumber`]}</span>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Quantity <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    className={`w-full px-3 py-2 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none ${errors[`multi_${index}_quantity`] ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter quantity"
                    value={delivery.quantity || ''}
                    onChange={(e) => handleMultiChange(index, 'quantity', e.target.value)}
                  />
                  {errors[`multi_${index}_quantity`] && (
                    <span className="text-red-500 text-xs mt-1">{errors[`multi_${index}_quantity`]}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <FormControl fullWidth size="small" error={!!errors[`multi_${index}_deliveryMode`]}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Delivery Mode <span className="text-red-600">*</span>
                  </label>
                  <Select
                    value={delivery.deliveryMode}
                    onChange={(e) => handleMultiChange(index, 'deliveryMode', e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value=""><span className="text-gray-500">Select delivery mode</span></MenuItem>
                    {deliveryModes.map((mode) => (
                      <MenuItem key={mode._id} value={mode.name}>{mode.name}</MenuItem>
                    ))}
                  </Select>
                  {errors[`multi_${index}_deliveryMode`] && (
                    <span className="text-red-500 text-xs mt-1">{errors[`multi_${index}_deliveryMode`]}</span>
                  )}

                  {(delivery.deliveryMode === "Break" || delivery.deliveryMode === "Hand Delivery + Courier") && (
                    <>
                      <input
                        type="text"
                        value={delivery.customDeliveryMode || ''}
                        onChange={(e) => handleMultiChange(index, 'customDeliveryMode', e.target.value)}
                        placeholder={`Enter details for "${delivery.deliveryMode}"`}
                        className={`mt-2 w-full px-3 py-2 text-sm border rounded outline-none ${errors[`multi_${index}_customDeliveryMode`] ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors[`multi_${index}_customDeliveryMode`] && (
                        <span className="text-red-500 text-xs mt-1">{errors[`multi_${index}_customDeliveryMode`]}</span>
                      )}
                    </>
                  )}
                </FormControl>

                <FormControl fullWidth size="small" error={!!errors[`multi_${index}_whoWillPay`]}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Who Will Pay {delivery.deliveryMode !== "Client Pickup" && <span className="text-red-600">*</span>}
                  </label>
                  <Select
                    value={delivery.whoWillPay}
                    onChange={(e) => handleMultiChange(index, 'whoWillPay', e.target.value)}
                    disabled={delivery.deliveryMode === 'Client Pickup'}
                    displayEmpty
                  >
                    <MenuItem value=""><span className="text-gray-500">Select Who Will Pay</span></MenuItem>
                    {whoWillPayOptions.map((opt) => (
                      <MenuItem key={opt._id} value={opt.name}>{opt.name}</MenuItem>
                    ))}
                  </Select>
                  {errors[`multi_${index}_whoWillPay`] && (
                    <span className="text-red-500 text-xs mt-1">{errors[`multi_${index}_whoWillPay`]}</span>
                  )}

                  {delivery.whoWillPay === "RD Courier" && (
                    <div className="mt-3 flex gap-3 items-center bg-white p-2 rounded border border-gray-200">
                      <div className="flex-1">
                        <Select
                          value={delivery.courierAmount || ''}
                          onChange={(e) => handleMultiChange(index, 'courierAmount', e.target.value)}
                          displayEmpty
                          size="small"
                          error={!!errors[`multi_${index}_courierAmount`]}
                          className="w-full bg-white text-sm"
                          sx={{ height: '36px' }}
                        >
                          <MenuItem value="">
                            <span className="text-gray-500">Select Amount Option</span>
                          </MenuItem>
                          <MenuItem value="50% RD">50% RD</MenuItem>
                          <MenuItem value="100% RD">100% RD</MenuItem>
                        </Select>
                        {errors[`multi_${index}_courierAmount`] && (
                          <span className="text-red-500 text-xs mt-1 block">{errors[`multi_${index}_courierAmount`]}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="checkbox"
                          checked={delivery.addInInvoice || false}
                          onChange={(e) => handleMultiChange(index, 'addInInvoice', e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300"
                        />
                        <label className="text-xs font-bold text-gray-700">Add to Invoice</label>
                      </div>
                    </div>
                  )}
                </FormControl>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Delivery Location <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={2}
                  className={`w-full px-3 py-2 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none ${errors[`multi_${index}_deliveryLocation`] ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter full address"
                  value={delivery.deliveryLocation}
                  onChange={(e) => handleMultiChange(index, 'deliveryLocation', e.target.value)}
                ></textarea>
                {errors[`multi_${index}_deliveryLocation`] && (
                  <span className="text-red-500 text-xs mt-1">{errors[`multi_${index}_deliveryLocation`]}</span>
                )}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addMultiDelivery}
            className="mt-2 px-4 py-2 border-2 border-dashed border-blue-400 text-blue-600 rounded-lg hover:bg-blue-50 font-semibold text-sm w-full flex justify-center items-center gap-2 transition-colors"
          >
            <span className="text-lg">+</span> Add Delivery Point
          </button>

          {errors.multiDeliveries && (
            <div className="mt-4 p-3 border border-red-300 bg-red-50 rounded text-red-600 text-sm font-semibold text-center">
              {errors.multiDeliveries}
            </div>
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-between mt-4">
        <button
          type="button"
          onClick={handleBack}
          className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
        >
          Back
        </button>

        <button
          type="button"
          onClick={onNextClick}
          className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
        >
          Next
        </button>
      </div>
    </form>
  );
}
