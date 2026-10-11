import React, { useState } from "react";

export default function BankAccountDetails({
  handleNext,
  handleBack,
  formData,
  setFormData,
}) {
  const [localData, setLocalData] = useState({
    additionalNotes: formData.additionalNotes || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    // update local
    setLocalData((prev) => ({ ...prev, [name]: value }));

    // update parent formData immediately
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const onNextClick = () => {
    handleNext(localData);
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">
        Bank Account Details
      </h2>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 flex flex-col items-center space-y-2">
        <p>
          <span className="font-semibold">A/c Holder's Name:</span> RD CUSTOM
          AWARDS PRIVATE LIMITED
        </p>
        <p>
          <span className="font-semibold">Bank Name:</span> HDFC BANK
        </p>
        <p>
          <span className="font-semibold">A/c No.:</span> 59209820490266
        </p>
        <p>
          <span className="font-semibold">Branch:</span> KALINA Branch
        </p>
        <p>
          <span className="font-semibold">IFS Code:</span> HDFC0001573
        </p>
      </div>

      {/* Additional Notes */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Additional Notes
        </label>
        <textarea
          name="additionalNotes"
          value={formData.additionalNotes || ""}
          onChange={handleChange}
          placeholder="Enter additional notes"
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
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
    </div>
  );
}
