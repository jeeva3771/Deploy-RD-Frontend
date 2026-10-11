import React, { useEffect, useState } from "react";
import ImageLightbox from "../../common/ImageLightbox";


export default function JobDetails({
  handleNext,
  handleBack,
  formData,
  SamplesalesOrderdata,
  handleSaveDraft,
  isSubmitting,
  isViewMode
}) {
  const [localData, setLocalData] = useState({
    jobNo: "",
    subJobNo: "",
    productName: "",
    jobQty: "",
    orgimage: "",
    jobDescription: "",
  });
  const [previewImage, setPreviewImage] = useState(null);


  const [errors, setErrors] = useState({});

  /* Sync incoming data */
  useEffect(() => {
    if (!SamplesalesOrderdata && !formData) return;

    setLocalData({
      jobNo: SamplesalesOrderdata?.job_no || formData?.jobNo || "",
      subJobNo: SamplesalesOrderdata?.sub_job_no || formData?.subJobNo || "",
      productName: SamplesalesOrderdata?.product_name || formData?.productName || "",
      jobQty: formData?.jobQty || SamplesalesOrderdata?.job_quantity || "",
      orgimage: SamplesalesOrderdata?.orgimage || formData?.orgimage || "",
      imageFile: null,
      jobDescription:
        SamplesalesOrderdata?.job_description ||
        formData?.jobDescription ||
        "",
    });
  }, [SamplesalesOrderdata, formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};

    // if (!localData.jobNo) newErrors.jobNo = "Job No is required";
    if (!localData.subJobNo) newErrors.subJobNo = "Sub Job No is required";
    if (!localData.productName)
      newErrors.productName = "Product name is required";
    if (!localData.jobQty)
      newErrors.jobQty = "Job quantity is required";
    if (!localData.jobDescription)
      newErrors.jobDescription = "Job description is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onNextClick = () => {
    if (validateForm()) {
      handleNext(localData);
      console.log("localData", localData)
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    setLocalData((prev) => ({
      ...prev,
      orgimage: previewUrl,
      imageFile: file,
    }));
  };

  const removeImage = () => {
    setLocalData((prev) => ({
      ...prev,
      orgimage: null,
      imageFile: null,
    }));
  };

  return (
    <form className="flex flex-col gap-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-800">
        Job Details
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Job No */}
        {/* <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Job No <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="jobNo"
            value={localData.jobNo}
            disabled
            className="w-full px-3 py-2 border rounded-lg border-gray-300 bg-gray-100"
          />
        </div> */}

        {/* Sub Job No */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Job No <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="subJobNo"
            value={`${localData.subJobNo}${SamplesalesOrderdata?.enquiry_id?.reference_no ? ` - ${SamplesalesOrderdata.enquiry_id.reference_no}` : ""}`}
            disabled={isViewMode}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg border-gray-300 bg-gray-100"
          />
        </div>

        {/* Product Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="productName"
            value={localData.productName}
            disabled={isViewMode}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg border-gray-300 bg-gray-100"
          />
        </div>

        {/* Job Quantity */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Job Quantity <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="jobQty"
            value={localData.jobQty}
            onChange={handleChange}
            disabled={isViewMode}

            className="w-full px-3 py-2 border rounded-lg border-gray-300 bg-gray-100"
          />
        </div>

        {/* Job Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Job Description <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="jobDescription"
            value={localData.jobDescription}
            onChange={handleChange}
            disabled={isViewMode}

            className={`w-full px-3 py-2 border rounded-lg ${errors.jobDescription
              ? "border-red-500"
              : "border-gray-300"
              }`}
          />
          {errors.jobDescription && (
            <span className="text-red-500 text-xs">
              {errors.jobDescription}
            </span>
          )}
        </div>
      </div>

      {/* Image */}
      {/* {SamplesalesOrderdata?.image && (
        <div className="mt-4 flex justify-center">
          <img
            src={SamplesalesOrderdata.image}
            alt="Job"
            className="w-64 h-64 object-contain border rounded-md"
          />
        </div>
      )} */}

      {/* Image Upload */}
      <div className="flex justify-center">
        {!localData.orgimage ? (
          <label
            htmlFor="imageUpload"
            className={`w-64 h-64 flex flex-col items-center justify-center
        border-2 border-dashed rounded-lg cursor-pointer
        transition-all
        ${isViewMode
                ? "border-gray-200 bg-gray-100 cursor-not-allowed"
                : "border-gray-300 hover:border-blue-500 hover:bg-blue-50"
              }`}
          >
            <svg
              className="w-10 h-10 text-gray-400 mb-2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1" />
              <path d="M12 12v7" />
              <path d="M8 12l4-4 4 4" />
            </svg>

            <p className="text-sm font-medium text-gray-600">
              Click to upload image
            </p>


            {!isViewMode && (
              <input
                id="imageUpload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            )}
          </label>
        ) : (
          <div className="relative w-64 h-64">
            <img
              src={localData.orgimage}
              alt="Preview"
              className="w-full h-full object-contain cursor-zoom-in"
              onClick={() => setPreviewImage(localData.orgimage)}
            />


            {!isViewMode && (
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>



      {/* Buttons */}
      <div className="flex justify-between mt-6">
        <button
          type="button"
          className="px-4 py-2 rounded-md bg-orange-500 text-white border border-orange-600 hover:bg-orange-600 cursor-not-allowed"

        >
          Back
        </button>


        {!isViewMode && (
          <button
            type="button"
            onClick={() => handleSaveDraft(localData)}
            className="px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save as Draft"}
          </button>
        )}
        <button
          type="button"
          onClick={onNextClick}
          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
        >
          Next
        </button>
      </div>
      {previewImage && (
        <ImageLightbox
          src={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </form>

  );
}
