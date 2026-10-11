import React, { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import { toast } from "react-toastify";
import { useLoader } from "../../../context/LoaderContext";
import { capitalizeFirst } from "../../../utils/helper/capitalize";
import { ItemOverviewModal } from "./ViewModal";
import ItemForm from "./Form";
import {
  fetchAllItems,
  deleteItem,
  setFilters,
  setPagination,
  resetPagination,
  setSortConfig,
  resetFilters,
  resetSortConfig,
  bulkUploadItems,
  downloadItemSampleTemplate,
} from "../../../reducer/inventory/itemReducer";
import { fetchAllUnits } from "../../../reducer/unitReducer";
import { fetchAllCategories } from "../../../reducer/inventory/common/materialCategoryReducer";
import { fetchAllTypes } from "../../../reducer/inventory/common/materialTypeReducer";
import { fetchAllVendors, getAllVendors } from "../../../reducer/vendorReducer";
import Pagination from "../../components/Pagination";
import DeleteModal from "../../components/DeleteModal";
import ActionButtons from "../../components/ActionButtons";
import SortableHeader from "../../components/SortableHeader";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";

const ItemList = () => {
  const { showLoader, hideLoader } = useLoader();
  const dispatch = useDispatch();

  // Redux state
  const { items, stats, loading, pagination, filters, sortConfig } = useSelector(
    (state) => state.items
  );
  const { categories } = useSelector((state) => state.materialCategories);

  // Local state for modals
  const [deleteModalData, setDeleteModalData] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showOverviewModal, setShowOverviewModal] = useState(false);
  const [selectedItemForOverview, setSelectedItemForOverview] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [uploadResultData, setUploadResultData] = useState(null);
  const [showUploadResultModal, setShowUploadResultModal] = useState(false);

  // Helper function to reset to default state
  const resetToDefaultState = useCallback(() => {
    dispatch(resetPagination());
    dispatch(resetFilters());
    dispatch(resetSortConfig());
    dispatch(setSortConfig({ key: "createdAt", direction: "desc" }));
  }, [dispatch]);

  // Fetch dropdown options on mount
  useEffect(() => {
    resetToDefaultState();
    const fetchOptions = async () => {
      try {
        await Promise.all([
          dispatch(
            fetchAllUnits({
              sortBy: "si_unit",
              sortOrder: "asc",
              is_active: true,
            })
          ).unwrap(),
          dispatch(fetchAllCategories()).unwrap(),
          dispatch(fetchAllTypes()).unwrap(),
        ]);
      } catch (error) {
        toast.error(error?.message || "Failed to load options");
      }
    };

    fetchOptions();

    // Cleanup function to reset state when component unmounts
    return () => {
      resetToDefaultState();
    };
  }, [dispatch, resetToDefaultState]);

  const lastFetchRef = useRef("");

  useEffect(() => {
    const fetchKey = JSON.stringify({
      page: pagination.page,
      limit: pagination.limit,
      search: filters.search,
      category: filters.category,
      sort: { key: sortConfig.key, direction: sortConfig.direction }
    });

    // Stop if we already fetched these exact parameters
    if (lastFetchRef.current === fetchKey) return;

    const timeoutId = setTimeout(async () => {
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          search: filters.search,
          is_inventory_item: "true"
        };

        if (filters.category) params.category = filters.category;
        if (sortConfig.key) {
          params.sortBy = sortConfig.key;
          params.sortOrder = sortConfig.direction;
        }

        await dispatch(fetchAllItems(params)).unwrap();
        lastFetchRef.current = fetchKey;
      } catch (error) {
        if (error !== "aborted") {
          console.error("Fetch error:", error);
        }
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [
    pagination.page,
    pagination.limit,
    filters.search,
    filters.category,
    sortConfig.key,
    sortConfig.direction,
    dispatch,
  ]);

  const handleEdit = async (item) => {
    setEditingItem(item);

    // Fetch vendors with inactive IDs included
    try {
      showLoader();
      const includeInactiveIds = (item.supplier_ids || [])
        .map((v) => (typeof v === "object" ? v._id : v))
        .join(",");

      const vendorParams = includeInactiveIds
        ? { include_inactive_ids: includeInactiveIds }
        : {};
      await dispatch(getAllVendors(vendorParams)).unwrap();
    } catch (err) {
      console.error("Error fetching vendors:", err);
      toast.error("Error loading vendors");
    } finally {
      hideLoader();
    }

    setShowFormModal(true);
  };

  const handleOverview = (item) => {
    setSelectedItemForOverview(item);
    setShowOverviewModal(true);
  };

  // BACKEND SORTING HANDLER
  const handleSort = (key) => {
    const newDirection =
      sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";

    dispatch(setSortConfig({ key, direction: newDirection }));
  };

  const getBadgeColor = (typeName) => {
    if (!typeName) return "bg-gray-400";
    const name = typeName.toLowerCase();

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = Math.abs(hash) % 360;
    const saturation = 65;
    const lightness = 50;

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  // FIXED: Reset and let useEffect trigger fetch
  const confirmDelete = async () => {
    try {
      showLoader();
      await dispatch(deleteItem({ id: deleteModalData.id })).unwrap();

      lastFetchRef.current = ""; // Clear cache to allow next fetch
      resetToDefaultState();

      // Directly trigger fetch to reload data
      dispatch(fetchAllItems({
        page: 1,
        limit: pagination.limit,
        search: "",
        category: "",
        is_inventory_item: "true",
        sortBy: "createdAt",
        sortOrder: "desc"
      }));

      toast.success("Item deleted successfully");
    } catch (error) {
      toast.error(error?.message || "Error deleting item");
    } finally {
      setDeleteModalData(null);
      hideLoader();
    }
  };

  const handleCreate = async () => {
    setEditingItem(null);

    try {
      showLoader();
      await dispatch(getAllVendors()).unwrap();
    } catch (err) {
      console.error("Error fetching vendors:", err);
      toast.error("Error loading vendors");
    } finally {
      hideLoader();
    }

    setShowFormModal(true);
  };

  const handleFormClose = () => {
    setShowFormModal(false);
    setEditingItem(null);
    // Removed manual fetch and reset logic to prevent flickering/jumping when simply closing
  };

  const handleFormSuccess = () => {
    setShowFormModal(false);
    setEditingItem(null);

    // If we want to show the new item at the top, we reset to page 1 and sort by newest
    // The useEffect will pick up these changes and fetch once.
    dispatch(setSortConfig({ key: "createdAt", direction: "desc" }));

    // If already on page 1 and no filters are active, Redux state won't change,
    // so we manually trigger the fetch.
    lastFetchRef.current = ""; // Clear cache
    dispatch(fetchAllItems({
      page: 1,
      limit: pagination.limit,
      search: "",
      category: "",
      is_inventory_item: "true",
      sortBy: "createdAt",
      sortOrder: "desc"
    }));

    if (pagination.page !== 1) {
      dispatch(setPagination({ page: 1 }));
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      showLoader();
      await dispatch(downloadItemSampleTemplate()).unwrap();
      toast.success("Sample template downloaded successfully");
    } catch (err) {
      console.error("Template download error:", err);
      toast.error(err?.message || "Failed to download sample template");
    } finally {
      hideLoader();
    }
  };

  const handleBulkUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      showLoader();
      const res = await dispatch(bulkUploadItems(formData)).unwrap();
      setUploadResultData(res.data || res);
      setShowUploadResultModal(true);

      if (res.data?.success > 0 || res.success) {
        toast.success(res.message || "Bulk upload completed");
        lastFetchRef.current = "";
        dispatch(
          fetchAllItems({
            page: 1,
            limit: pagination.limit,
            search: filters.search,
            category: filters.category,
            is_inventory_item: "true",
            sortBy: sortConfig.key || "createdAt",
            sortOrder: sortConfig.direction || "desc",
          })
        );
        if (pagination.page !== 1) {
          dispatch(setPagination({ page: 1 }));
        }
      } else {
        toast.error(res.message || "Bulk upload failed");
      }
    } catch (err) {
      console.error("Bulk upload error:", err);
      if (err?.data) {
        setUploadResultData(err.data);
        setShowUploadResultModal(true);
      }
      toast.error(err?.message || "Bulk upload failed");
    } finally {
      hideLoader();
      e.target.value = null; // Clear file input
    }
  };

  const handleSearchChange = (value) => {
    dispatch(setFilters({ search: value }));
    dispatch(setPagination({ page: 1 }));
  };

  const handleCategoryChange = (value) => {
    dispatch(setFilters({ category: value }));
    dispatch(resetPagination());
  };

  const handlePageChange = (newPage) => {
    dispatch(setPagination({ page: newPage }));
  };

  const handleItemsPerPageChange = (newLimit) => {
    dispatch(setPagination({ limit: newLimit, page: 1 }));
  };

  const startIndex = (pagination.page - 1) * pagination.limit;

  return (
    <div className="bg-gray-50 mt-5">
      {/* Quick Stats */}
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-600 text-white rounded-lg p-4 text-center">
            <span className="text-3xl font-bold mb-1 break-words">
              {pagination.total || 0}
            </span><br />
            <b className="text-sm">Total Items</b>
          </div>
          <div className="bg-blue-600 text-white rounded-lg p-4 text-center">
            <span className="text-3xl font-bold mb-1 break-words">
              {stats?.totalStockUnits || 0}
            </span><br />
            <b className="text-sm">Total Stock Units</b>
          </div>
          <div className="bg-blue-600 text-white rounded-lg p-4 text-center">
            <span className="text-3xl font-bold mb-1 break-words">
              {stats?.lowStockItems || 0}
            </span><br />
            <b className="text-sm">Low Stock Items</b>
          </div>
          <div className="bg-blue-600 text-white rounded-lg p-4 text-center">
            <span className="text-3xl font-bold mb-1 break-words">
              ₹{Number(stats?.totalStockValue || 0).toFixed(0)}
            </span><br />
            <b className="text-sm">Total Stock Value</b>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold text-blue-600">Item Management</h2>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Download Template Button */}
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-4 py-2 border border-blue-600 text-blue-600 bg-white hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer"
              title="Download Sample Excel Template"
            >
              <DownloadIcon sx={{ fontSize: 18 }} />
              <span>Download Template</span>
            </button>

            {/* Bulk Upload Button */}
            <div className="relative">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                id="item-bulk-upload-input"
                onChange={handleBulkUpload}
              />
              <label
                htmlFor="item-bulk-upload-input"
                className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer shadow-sm"
                title="Bulk Upload Items from Excel/CSV"
              >
                <UploadFileIcon sx={{ fontSize: 18 }} />
                <span>Bulk Upload</span>
              </label>
            </div>

            {/* Add Item Button */}
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-sm text-sm"
              style={{ backgroundColor: "#574fdd" }}
              onClick={handleCreate}
            >
              <span className="text-lg leading-none">+</span>
              <span>Add Item</span>
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                  placeholder="Search by item code, material name, specifications..."
                  value={filters.search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
            </div>
            <div>
              <FormControl fullWidth variant="outlined" size="small">
                <Select
                  id="all_category_select"
                  value={filters.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  name="all_category_select"
                  displayEmpty
                  size="small"
                >
                  <MenuItem value="">
                    <span className="text-gray-1000">All Categories</span>
                  </MenuItem>

                  {categories.map((cat) => (
                    <MenuItem key={cat._id} value={cat._id}>
                      {capitalizeFirst(cat.name)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <SortableHeader
                    label="Item Code"
                    sortKey="item_code"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Material Name"
                    sortKey="name"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Type of Material"
                    sortKey="type_id"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Category"
                    sortKey="category_id"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  {/* <SortableHeader
                    label="Stock"
                    sortKey="stock"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Min Stock"
                    sortKey="min_stock"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  /> */}
                  <SortableHeader
                    label="Price"
                    sortKey="price"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  {/* <SortableHeader
                    label="Cost"
                    sortKey="cost"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  /> */}
                  <SortableHeader
                    label="Cost"
                    sortKey="cost"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Rate Unit"
                    sortKey="unit"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {!loading && items.length === 0 ? (
                  <tr>
                    <td
                      colSpan="10"
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No data found
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr
                      key={item._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        {item.item_code}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {capitalizeFirst(item.name)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          style={{
                            backgroundColor: getBadgeColor(item.type?.name),
                            color: "#fff",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "500",
                          }}
                        >
                          {item.type?.name || "N/A"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded text-xs font-medium">
                          {item.category?.name || "-"}
                        </span>
                      </td>
                      {/* <td className="px-4 py-3 text-sm">
                        <span
                          className={`font-medium ${
                            item.stock <= item.min_stock
                              ? "text-red-600"
                              : item.stock <= item.min_stock * 1.5
                              ? "text-yellow-600"
                              : "text-green-600"
                          }`}
                        >
                          {item.stock}{" "}
                          {/* {item.unit?.short_code || item.unit?.name}
                          {item.stock <= item.min_stock && (
                            <span className="ml-1">⚠️</span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {item.min_stock}{" "}
                        {/* {item.unit?.short_code || item.unit?.name}
                      </td> */}
                      <td className="px-4 py-3 text-sm text-gray-700">
                        ₹{Number(item.price || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        ₹{Number(item.cost || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {item.unit?.symbol || item.unit?.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <ActionButtons
                          item={item}
                          onView={() => handleOverview(item)}
                          onEdit={() => handleEdit(item)}
                          onDelete={() => setDeleteModalData(item)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={pagination.limit}
            onItemsPerPageChange={handleItemsPerPageChange}
            totalCount={pagination.total}
            startIndex={startIndex}
            visibleItemCount={items.length}
            listType={true}
          />
        </div>
      </div>

      {/* Form Modal */}
      {showFormModal && (
        <ItemForm
          editingItem={editingItem}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Overview Modal */}
      {showOverviewModal && selectedItemForOverview && (
        <ItemOverviewModal
          item={selectedItemForOverview}
          onClose={() => {
            setShowOverviewModal(false);
            setSelectedItemForOverview(null);
          }}
          onEdit={handleEdit}
          getBadgeColor={getBadgeColor}
        />
      )}

      {/* Delete Modal */}
      <DeleteModal
        deleteModalData={deleteModalData}
        onCancel={() => setDeleteModalData(null)}
        confirmDelete={confirmDelete}
      />

      {/* Bulk Upload Result Modal */}
      {showUploadResultModal && uploadResultData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <UploadFileIcon />
                <h3 className="text-lg font-bold">Bulk Upload Summary</h3>
              </div>
              <button
                onClick={() => {
                  setShowUploadResultModal(false);
                  setUploadResultData(null);
                }}
                className="text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Quick Summary Cards */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <span className="text-2xl font-bold text-blue-700">{uploadResultData.total || 0}</span>
                  <p className="text-xs font-semibold text-blue-600 mt-0.5">Total Processed</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <span className="text-2xl font-bold text-emerald-700">{uploadResultData.success || 0}</span>
                  <p className="text-xs font-semibold text-emerald-600 mt-0.5">Successful</p>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                  <span className="text-2xl font-bold text-rose-700">{uploadResultData.failed || 0}</span>
                  <p className="text-xs font-semibold text-rose-600 mt-0.5">Failed</p>
                </div>
              </div>

              {/* Errors Section */}
              {uploadResultData.errors && uploadResultData.errors.length > 0 ? (
                <div>
                  <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    Failed Items ({uploadResultData.errors.length})
                  </h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200 sticky top-0">
                        <tr>
                          <th className="p-2.5 w-16">Row #</th>
                          <th className="p-2.5 w-40">Item Name</th>
                          <th className="p-2.5">Error Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {uploadResultData.errors.map((err, idx) => (
                          <tr key={idx} className="hover:bg-rose-50/50 transition">
                            <td className="p-2.5 font-bold text-gray-600">{err.row}</td>
                            <td className="p-2.5 font-medium text-gray-800 break-words">{err.item_name}</td>
                            <td className="p-2.5 text-rose-600 font-medium">{err.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 text-center">
                  <p className="text-emerald-700 font-semibold text-sm">🎉 All rows were processed and created successfully!</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => {
                  setShowUploadResultModal(false);
                  setUploadResultData(null);
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-sm cursor-pointer"
                style={{ backgroundColor: "#574fdd" }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemList;
