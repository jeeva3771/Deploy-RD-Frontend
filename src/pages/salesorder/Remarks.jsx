import React, { useState } from "react";

export default function Remarks({ handleNext, handleBack, formData, setFormData, isSubmitting }) {
  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, remarks: e.target.value }));
  };

  const onNextClick = async () => {
    await handleNext({ remarks: formData.remarks });
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">
        Remarks
      </h2>

      <div>
        <label className="block text-sm font-medium mb-1">Remarks</label>
        <textarea
          name="remarks"
          value={formData.remarks || ""}
          onChange={handleChange}
          placeholder="Additional remarks or notes..."
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={handleBack}
          disabled={isSubmitting}   // disable during submit
          className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
        >
          Back
        </button>

        <button
          type="button"
          onClick={onNextClick}
          disabled={isSubmitting}   // disable during submit
          className={`px-4 py-2 rounded-md text-white text-sm hover:bg-blue-700
            ${isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600"}`}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <span className="loader border-2 border-white border-t-transparent rounded-full w-4 h-4 animate-spin"></span>
              Submitting...
            </div>
          ) : (
            "Submit"
          )}
        </button>
      </div>
    </div>
  );
}
