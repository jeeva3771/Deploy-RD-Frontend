import React, { useEffect, useState } from "react";
import ImageLightbox from "../../common/ImageLightbox";

export default function JobDetails({
  handleNext,
  handleBack,
  formData,
  SamplesalesOrderdata,
  isViewMode
}) {
  const [previewImage, setPreviewImage] = useState(null);
  const [localData, setLocalData] = useState({
    jobNo: "",
    subJobNo: "",
    productName: "",
    jobQty: "",
    orgimage: "",
    jobDescription: "",
  });

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

    if (!localData.jobNo) newErrors.jobNo = "Job No is required";
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
            disabled
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
            disabled
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
      {SamplesalesOrderdata?.image && (
        <div className="mt-4 flex justify-center">
          <img
            src={SamplesalesOrderdata.image}
            alt="Job"
            className="w-64 h-64 object-contain cursor-zoom-in"
            onClick={() => setPreviewImage(SamplesalesOrderdata.image)}
          />
        </div>
      )}

      <ImageLightbox
        src={previewImage}
        fileName={SamplesalesOrderdata?.sub_job_no || "Job Image"}
        onClose={() => setPreviewImage(null)}
      />

      {/* Buttons */}
      <div className="flex justify-between mt-6">
        <button
          type="button"
          className="px-4 py-2 rounded-md bg-orange-500 text-white border border-orange-600 hover:bg-orange-600 cursor-not-allowed"

        >
          Back
        </button>


        <button
          type="button"
          onClick={onNextClick}
          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
        >
          Next
        </button>
      </div>
    </form>
  );
}
