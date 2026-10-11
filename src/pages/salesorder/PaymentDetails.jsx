import React, { useEffect, useState } from "react";
import { axiosInstance, backendUrl } from "../../utils/url/config";
import { useDispatch, useSelector } from "react-redux";
import { fetchppayment } from "../../reducer/commonReducer";

export default function PaymentDetails({ handleNext, handleBack, formData, setFormData }) {
  const [localData, setLocalData] = useState({
    payment_terms: formData.payment_terms || "",
  });

  const [errors, setErrors] = useState({});

  const dispatch = useDispatch();

  const { payments, loadingppaymenta } = useSelector(
    (state) => state.commondropdowns
  );

  useEffect(() => {
    dispatch(fetchppayment());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Update local UI
    setLocalData((prev) => ({ ...prev, [name]: value }));

    // Update parent saved data
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    let newErrors = {};

    if (!localData.payment_terms)
      newErrors.payment_terms = "Please select a payment option";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onNextClick = () => {
    if (validateForm()) handleNext(localData);
  };

  return (
    <form className="flex flex-col gap-6">
      {/* Title */}
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">
        Payment Options <span className="text-red-500">*</span>
      </h2>

      {/* Payment Terms List */}
      <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
        {loadingppaymenta ? (
          <p className="text-gray-500 text-sm">Loading payment terms...</p>
        ) : payments.length > 0 ? (
          payments.map((term) => (
            <div
              key={term._id}
              className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-blue-600 hover:bg-blue-900/5 transition-colors"
            >
              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="payment_terms"
                  value={term.name}
                  checked={localData.payment_terms === term.name}
                  onChange={handleChange}
                  className="mt-1 mr-2 sm:mr-3 accent-blue-600 flex-shrink-0"
                />
                <div>
                  <span className="font-medium text-gray-800 block mb-1 text-sm sm:text-base">
                    {term.name}
                  </span>
                </div>
              </label>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm">No payment terms available</p>
        )}

        {errors.payment_terms && (
          <span className="text-red-500 text-xs sm:text-sm mt-1 block">
            {errors.payment_terms}
          </span>
        )}
      </div>

      {/* Buttons */}
      <div className="flex justify-between mt-2">
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
