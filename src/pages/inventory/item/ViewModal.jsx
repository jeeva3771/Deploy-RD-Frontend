import React, { useState, useEffect } from "react";
import { capitalizeFirst } from "../../../utils/helper/capitalize";
import { useDispatch, useSelector } from "react-redux";
import { fetchBOMById as fetchStandardBOM } from "../../../reducer/bomReducer";
import { fetchBOMById as fetchStandaloneBOM } from "../../../reducer/standalone_bomReducer";
import { toast } from "react-toastify";

// View/Overview Modal
export const ItemOverviewModal = ({ item, onClose, onEdit, getBadgeColor }) => {
  console.log("Viewing Item Data:", item);
  const dispatch = useDispatch();
  const [sourceData, setSourceData] = useState(null);
  const [isFetchingSource, setIsFetchingSource] = useState(false);

  const isCustom = item?.item_code?.startsWith("CUS") || item?.is_inventory_item === false;

  const safeGetBadgeColor = (name) => {
    if (typeof getBadgeColor === "function") {
      return getBadgeColor(name);
    }
    return "#3b82f6";
  };

  useEffect(() => {
    const fetchSource = async () => {
      if (!item?.source_bom_id || !item?.source_bom_type) return;

      try {
        setIsFetchingSource(true);
        let action;
        if (item.source_bom_type === "quotation") {
          action = await dispatch(fetchStandardBOM(item.source_bom_id)).unwrap();
        } else if (item.source_bom_type === "standalone") {
          action = await dispatch(fetchStandaloneBOM(item.source_bom_id)).unwrap();
        }
        setSourceData(action);
      } catch (error) {
        console.error("Failed to fetch source BOM details:", error);
      } finally {
        setIsFetchingSource(false);
      }
    };

    fetchSource();
  }, [item, dispatch]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 max-w-6xl w-full max-h-[90vh] overflow-y-auto my-8">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-blue-600 flex items-center gap-2">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Item Overview: {capitalizeFirst(item.name)}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-blue-600 text-white px-4 py-3">
                  <span style={{ color: "#fff" }} className="font-semibold flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                    Basic Information
                  </span>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">
                      Item Code:
                    </span>
                    <span className="font-bold text-blue-600">
                      {item.item_code}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">
                      Material Name:
                    </span>
                    <span className="text-gray-900">{item.name}</span>
                  </div>
                  {isCustom ? (
                    <>
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-700">Job No:</span>
                        <span className="text-gray-900">{item.job_no || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-700">Sub Job No:</span>
                        <span className="text-gray-900">{item.sub_job_no || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-700">Ref No:</span>
                        <span className="text-gray-900">{item.reference_no || "-"}</span>
                      </div>
                      {item.item_type?.toLowerCase() === "sheet" && (
                        <>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700">Sheet Size:</span>
                            <span className="text-gray-900">{item.sheet_size || "-"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700">Thickness:</span>
                            <span className="text-gray-900">
                              {item.thickness ? `${item.thickness} mm` : "-"}
                            </span>
                          </div>
                        </>
                      )}
                      {item.item_type?.toLowerCase() === "direct" && (
                        <>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700">Length:</span>
                            <span className="text-gray-900">{item.length || "-"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700">Width:</span>
                            <span className="text-gray-900">{item.width || "-"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700">Height:</span>
                            <span className="text-gray-900">{item.height || "-"}</span>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-700">Type:</span>
                        <span
                          style={{
                            backgroundColor: safeGetBadgeColor(item.type?.name),
                            color: "#fff",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "500",
                          }}
                        >
                          {item.type?.name || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-700">
                          Category:
                        </span>
                        <span className="bg-gray-100 text-gray-800 px-2.5 py-1 rounded text-xs font-medium">
                          {item.category?.name || "-"}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">Unit:</span>
                    <span className="text-gray-900">
                      {isCustom ? (
                        <>
                          {item.rate_unit?.symbol || item.unit?.symbol || "Unknown"} ({item.rate_unit?.name || item.unit?.name || "-"})
                        </>
                      ) : (
                        <>
                          {item.unit?.symbol || item.unit?.si_unit || "Unknown"} ({item.unit?.name || "-"})
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stock Information */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-blue-600 text-white px-4 py-3">
                <span style={{ color: "#fff" }} className="font-semibold flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  Stock Information
                </span>
              </div>
              <div className="p-4">
                {isCustom ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className={`border-2 rounded-lg p-3 text-center transition-all col-span-2 border-blue-500`}
                    >
                      <div className="text-2xl font-bold text-blue-600">
                        {item.stock || 0}
                      </div>
                      <div className="text-sm text-gray-500">Current Stock</div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className={`border-2 rounded-lg p-3 text-center transition-all ${
                        item.stock <= item.min_stock
                          ? "border-red-500"
                          : "border-green-500"
                      }`}
                    >
                      <div className="text-2xl font-bold text-green-600">
                        {item.stock || 0}
                      </div>
                      <div className="text-sm text-gray-500">Current Stock</div>
                    </div>
                    <div className="border-2 border-gray-400 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-gray-600">
                        {item.min_stock || 0}
                      </div>
                      <div className="text-sm text-gray-500">Min Stock</div>
                    </div>
                    <div className="border-2 border-blue-500 rounded-lg p-3 text-center col-span-2">
                      <div className="text-2xl font-bold text-blue-600">
                        {item.max_stock || 0}
                      </div>
                      <div className="text-sm text-gray-500">Max Stock</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Information */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-blue-600 text-white px-4 py-3">
                <span style={{ color: "#fff" }} className="font-semibold flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Financial Information
                </span>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">
                      Selling Price:
                    </span>
                    <span className="font-bold text-green-600">
                      ₹{Number(item.price || 0).toFixed(2)}
                    </span>
                  </div>
                  {!isCustom && (
                    <>
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-700">
                          Cost Price:
                        </span>
                        <span className="font-bold text-red-600">
                          ₹{Number(item.cost || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-700">
                          Current Value:
                        </span>
                        <span className="font-bold text-blue-600">
                          ₹{Number((item.stock || 0) * Number(item.cost || 0)).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-700">
                          Profit Rate:
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded text-xs font-bold ${
                            (item.profit_rate || 0) > 50
                              ? "bg-green-500 text-white"
                              : "bg-yellow-500 text-white"
                          }`}
                        >
                          {Number(item.profit_rate || 0).toFixed(1)}%
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-blue-600 text-white px-4 py-3">
                <span style={{ color: "#fff" }} className="font-semibold flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                    />
                  </svg>
                  Additional Information
                </span>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">
                      Vendors:
                    </span>
                    <span className="text-gray-900">
                      {item.vendor_name 
                        ? capitalizeFirst(item.vendor_name)
                        : item.reference_vendor_name 
                        ? capitalizeFirst(item.reference_vendor_name)
                        : Array.isArray(item.supplier_names) && item.supplier_names.length > 0
                        ? item.supplier_names
                            .map((name) => capitalizeFirst(name))
                            .join(", ")
                        : "Not entered"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">
                      Created At:
                    </span>
                    <span className="text-gray-900">
                      {item.created_at || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">
                      Created By:
                    </span>
                    <span className="text-gray-900 capitalize">
                      {item.createdBy?.name || "-"}
                    </span>
                  </div>
                  {!isCustom && (
                    <>
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-700">
                          Updated At:
                        </span>
                        <span className="text-gray-900 capitalize">
                          {item.updated_at || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-700">
                          Updated By:
                        </span>
                        <span className="text-gray-900 capitalize">
                          {item.updatedBy?.name || "-"}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

          </div>
          {/* Source Job Details (Provenance) */}
          {isCustom && (item.source_bom_id || sourceData) && (
            <div className="mt-6">
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-purple-600 text-white px-4 py-3 flex justify-between items-center">
                  <span style={{ color: "#fff" }} className="font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Source Job Details
                  </span>
                  {isFetchingSource && <span className="text-xs animate-pulse italic">Updating...</span>}
                </div>
                <div className="p-4">
                  {sourceData ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 uppercase font-bold mb-1">Original Client</span>
                        <span className="text-gray-900 font-medium">
                          {sourceData.client_name || sourceData.client || sourceData.enquiry_id?.name || "—"}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 uppercase font-bold mb-1">Product Name</span>
                        <span className="text-gray-900 font-medium">
                          {sourceData.product_name || sourceData.name || sourceData.enquiry_id?.product_name || "—"}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 uppercase font-bold mb-1">Source Job No.</span>
                        <span className="text-purple-700 font-bold">{sourceData.job_no || "—"}</span>
                      </div>
                    </div>
                  ) : isFetchingSource ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span className="text-gray-500 text-sm italic">Fetching provenance details...</span>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm italic py-2">
                      No linked job data found for this item.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Material Specifications */}
          {item.specifications && (
            <div className="mt-6">
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-blue-600 text-white px-4 py-3">
                  <span style={{ color: "#fff" }} className="font-semibold flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Material Specifications
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-gray-700">{item.specifications}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
