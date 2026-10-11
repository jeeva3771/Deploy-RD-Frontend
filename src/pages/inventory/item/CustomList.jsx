import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useLoader } from "../../../context/LoaderContext";
import { capitalizeFirst } from "../../../utils/helper/capitalize";
import { ItemOverviewModal } from "./ViewModal";
import ItemForm from "./Form";
import {
  fetchAllCustomItems,
  deleteCustomItem,
  setCustomFilters,
  setCustomPagination,
  resetCustomPagination,
  setCustomSortConfig,
  resetCustomFilters,
  resetCustomSortConfig,
} from "../../../reducer/inventory/customItemReducer";
import { fetchAllUnits } from "../../../reducer/unitReducer";
import { fetchAllCategories } from "../../../reducer/inventory/common/materialCategoryReducer";
import { fetchAllTypes } from "../../../reducer/inventory/common/materialTypeReducer";
import { getAllVendors } from "../../../reducer/vendorReducer";
import Pagination from "../../components/Pagination";
import DeleteModal from "../../components/DeleteModal";
import ActionButtons from "../../components/ActionButtons";
import SortableHeader from "../../components/SortableHeader";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";

const CustomItemList = () => {
  const { showLoader, hideLoader } = useLoader();
  const dispatch = useDispatch();

  // Redux state
  const { customItems: items, stats, loading, pagination, filters, sortConfig } = useSelector(
    (state) => state.customItems
  );
  const { categories } = useSelector((state) => state.materialCategories);

  // Local state for modals
  const [deleteModalData, setDeleteModalData] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showOverviewModal, setShowOverviewModal] = useState(false);
  const [selectedItemForOverview, setSelectedItemForOverview] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  // Helper function to reset to default state
  const resetToDefaultState = useCallback(() => {
    dispatch(resetCustomPagination());
    dispatch(resetCustomFilters());
    dispatch(resetCustomSortConfig());
    dispatch(setCustomSortConfig({ key: "createdAt", direction: "desc" }));
  }, [dispatch]);

  // Fetch dropdown options on mount
  useEffect(() => {
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
      sort: { key: sortConfig.key, direction: sortConfig.direction },
    });

    // Stop if we already fetched these exact parameters
    if (lastFetchRef.current === fetchKey) return;

    const timeoutId = setTimeout(async () => {
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          search: filters.search,
        };

        if (filters.category) params.category = filters.category;
        if (sortConfig.key) {
          params.sortBy = sortConfig.key;
          params.sortOrder = sortConfig.direction;
        }

        await dispatch(fetchAllCustomItems(params)).unwrap();
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

    dispatch(setCustomSortConfig({ key, direction: newDirection }));
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

  const confirmDelete = async () => {
    try {
      showLoader();
      await dispatch(deleteCustomItem(deleteModalData.id)).unwrap();

      resetToDefaultState();
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
  };

  const handleFormSuccess = () => {
    setShowFormModal(false);
    setEditingItem(null);

    dispatch(setCustomSortConfig({ key: "createdAt", direction: "desc" }));

    if (pagination.page !== 1) {
      dispatch(setCustomPagination({ page: 1 }));
    }
  };

  const handleSearchChange = (value) => {
    dispatch(setCustomFilters({ search: value }));
    dispatch(setCustomPagination({ page: 1 }));
  };

  const handleCategoryChange = (value) => {
    dispatch(setCustomFilters({ category: value }));
    dispatch(resetCustomPagination());
  };

  const handlePageChange = (newPage) => {
    dispatch(setCustomPagination({ page: newPage }));
  };

  const handleItemsPerPageChange = (newLimit) => {
    dispatch(setCustomPagination({ limit: newLimit, page: 1 }));
  };

  useEffect(() => {
    console.log("Custom Items List Data:", items);

  }, [items]);

  const startIndex = (pagination.page - 1) * pagination.limit;

  return (
    <div className="bg-gray-50 mt-5">
      {/* Quick Stats */}
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-blue-600 text-white rounded-lg p-4 text-center">
            <span className="text-3xl font-bold mb-1 break-words">
              {pagination.total || 0}
            </span><br />
            <b className="text-sm">Custom Items</b>
          </div>
          <div className="bg-blue-600 text-white rounded-lg p-4 text-center">
            <span className="text-3xl font-bold mb-1 break-words">
              {stats?.totalStockUnits || 0}
            </span><br />
            <b className="text-sm">Total Stock Units</b>
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold text-blue-600">Custom Item Management</h2>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm border-gray-200 p-4 mb-6">
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
              placeholder="Search custom items..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Sub Job No
                  </th>
                  <SortableHeader
                    label="Price"
                    sortKey="price"
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
                      colSpan="11"
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No custom items found
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
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {item.sub_job_no || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        ₹{Number(item.price || 0).toFixed(2)}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-700">
                        {item.rate_unit?.symbol || item.rate_unit?.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <ActionButtons
                          item={item}
                          onView={() => handleOverview(item)}
                          onDelete={() => setDeleteModalData(item)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

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

      {showFormModal && (
        <ItemForm
          editingItem={editingItem}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
          initialIsInventoryItem={false}
        />
      )}

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

      <DeleteModal
        deleteModalData={deleteModalData}
        onCancel={() => setDeleteModalData(null)}
        confirmDelete={confirmDelete}
      />
    </div>
  );
};

export default CustomItemList;
