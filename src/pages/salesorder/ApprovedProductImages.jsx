import React, { useState, useEffect } from "react";

export default function ApprovedProductImages({ handleNext, handleBack, SamplesalesOrderdata }) {
  const [loading, setLoading] = useState(true);
  const imageUrl = SamplesalesOrderdata?.image;

  useEffect(() => {
    if (imageUrl) {
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => setLoading(false);
    }
  }, [imageUrl]);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">
        Approved Product Images
      </h2>

      {!imageUrl ? (
        <p className="text-gray-500 text-sm">No approved product image available.</p>
      ) : (
        <div className="flex items-center justify-center">
          {loading && <div className="w-48 h-48 bg-gray-200 animate-pulse rounded-lg"></div>}
          <img
            src={imageUrl}
            alt="Approved Product"
            loading="lazy"
            className={`max-w-full max-h-60 object-contain border rounded-lg p-4 bg-gray-50 hover:shadow-lg transition-shadow ${
              loading ? "hidden" : "block"
            }`}
          />
        </div>
      )}

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
          onClick={() => handleNext({})}
          className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
        >
          Next
        </button>
      </div>
    </div>
  );
}
