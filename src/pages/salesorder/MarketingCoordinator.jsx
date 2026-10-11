import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMarketingCoordinators } from "../../reducer/sampleSalesorderReducer";
import { FormControl, Select, MenuItem, Chip, Box } from "@mui/material";
import { capitalizeFirst } from "../../utils/helper/capitalize";

export default function MarketingCoordinator({
  handleNext,
  handleBack,
  formData,
  SamplesalesOrderdata,
  setFormData,
}) {
  const dispatch = useDispatch();

  const { coordinators = [], loadingCoordinators } = useSelector(
    (state) => state.sampleSalesOrders || {}
  );

  const [localData, setLocalData] = useState({
    coordinatorIds: formData.coordinatorIds || [],
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    dispatch(fetchMarketingCoordinators());
  }, [dispatch]);

  // Set coordinators from existing data and filter out those not in the active list
  useEffect(() => {
    if (coordinators.length > 0) {
      let initialIds = localData.coordinatorIds;

      // 1. If initializing for the first time from SamplesalesOrderdata
      if (
        SamplesalesOrderdata?.enquiry_id?.marketing_cordinator &&
        initialIds.length === 0
      ) {
        initialIds = SamplesalesOrderdata.enquiry_id.marketing_cordinator.map(
          (coord) => coord._id
        );
      }

      // 2. Filter: Only keep IDs that are present in the current coordinators list
      const validIds = initialIds.filter((id) =>
        coordinators.some((c) => c._id === id)
      );

      // Only update if the filtered list is different from current selection
      if (JSON.stringify(validIds) !== JSON.stringify(localData.coordinatorIds)) {
        setLocalData((prev) => ({ ...prev, coordinatorIds: validIds }));
        setFormData((prev) => ({ ...prev, coordinatorIds: validIds }));
      }
    }
  }, [coordinators, SamplesalesOrderdata, localData.coordinatorIds, setFormData]);

  const handleChange = (e) => {
    const value = e.target.value;
    setLocalData({
      ...localData,
      coordinatorIds: typeof value === "string" ? value.split(",") : value,
    });

    // Update parent saved data
    setFormData((prev) => ({
      ...prev,
      coordinatorIds: typeof value === "string" ? value.split(",") : value,
    }));
    setErrors({ ...errors, coordinatorIds: "" });
  };

  const validateForm = () => {
    let newErrors = {};
    if (!localData.coordinatorIds || localData.coordinatorIds.length === 0) {
      newErrors.coordinatorIds =
        "Please select at least one marketing coordinator";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onNextClick = () => {
    if (validateForm()) {
      handleNext(localData);
    }
  };

  // Function to get coordinator name by ID with fallback for migration
  const getCoordinatorName = (id) => {
    const coordinator = coordinators.find((c) => c._id === id);
    if (coordinator) return coordinator.name;

    // Fallback: Check if the name is available in the original SamplesalesOrderdata
    const existing = SamplesalesOrderdata?.enquiry_id?.marketing_cordinator?.find(
      (c) => (typeof c === "object" ? c._id === id : c === id)
    );
    if (existing && typeof existing === "object") return existing.name;

    return id;
  };

  return (
    <form className="flex flex-col gap-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">
        Assign Marketing Coordinator(s)
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <FormControl fullWidth variant="outlined" size="small">
          <label
            className="block text-sm font-semibold text-gray-700 mb-2"
            htmlFor="coordinator-select"
          >
            Coordinator(s) <span className="text-red-600">*</span>
          </label>

          <Select
            id="coordinator-select"
            name="coordinatorIds"
            multiple
            value={localData.coordinatorIds}
            onChange={handleChange}
            displayEmpty
            disabled={loadingCoordinators}
            size="small"
            error={!!errors.coordinatorIds}
            renderValue={(selected) => {
              if (selected.length === 0) {
                return (
                  <span className="text-gray-500">
                    {loadingCoordinators
                      ? "Loading coordinators..."
                      : "Select Coordinator(s)"}
                  </span>
                );
              }

              return (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip
                      key={value}
                      label={capitalizeFirst(getCoordinatorName(value))}
                      size="small"
                      sx={{
                        bgcolor: "var(--chip-bg)",
                        color: "var(--chip-text)",
                        borderRadius: "6px",
                        fontSize: "0.80rem",
                        paddingX: "4px",
                      }}
                    />
                  ))}
                </Box>
              );
            }}
          >
            <MenuItem value="" disabled>
              <span className="text-gray-500">
                {loadingCoordinators
                  ? "Loading coordinators..."
                  : "Select Coordinator(s)"}
              </span>
            </MenuItem>

            {coordinators.length > 0 &&
              [...coordinators]
                .sort((a, b) =>
                  a.name.toLowerCase().localeCompare(b.name.toLowerCase())
                )
                .map((user) => (
                  <MenuItem key={user._id} value={user._id}>
                    {capitalizeFirst(user?.name)} - ({user?.role?.name})
                  </MenuItem>
                ))}

            {!loadingCoordinators && coordinators.length === 0 && (
              <MenuItem value="" disabled>
                No coordinators available
              </MenuItem>
            )}
          </Select>

          {errors.coordinatorIds && (
            <p className="text-red-600 text-sm mt-1">{errors.coordinatorIds}</p>
          )}
        </FormControl>
      </div>

      <div className="flex justify-between mt-4">
        <button
          type="button"
          onClick={handleBack}
          className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
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
