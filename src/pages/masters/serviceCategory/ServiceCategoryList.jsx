// src/pages/servicecategory/ServiceCategoryList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllServiceCategories,
  deleteServiceCategory,
  setFilters,
  setPagination,
  setSortConfig,
  resetFilters,
  resetPagination,
  resetSortConfig,
} from "../../../reducer/serviceCategoryReducer";
import { toast } from "react-toastify";
import { capitalizeFirst } from "../../../utils/helper/capitalize";
import ActionButtons from "../../components/ActionButtons";
import SortableHeader from "../../components/SortableHeader";
import Pagination from "../../components/Pagination";
import DeleteModal from "../../components/DeleteModal";
import StatusBadge from "../../components/StatusBadge";
import ViewModal from "./ViewModal";

const ServiceCategoryList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [viewModalData, setViewModalData] = useState(null);
  const [deleteModalData, setDeleteModalData] = useState(null);

  const {
    serviceCategory,
    loading,
    pagination,
    filters,
    sortConfig,
  } = useSelector((state) => state.serviceCategory);

  // local UI-only state for entries selector
  const [localEntries, setLocalEntries] = useState(pagination.limit || 5);

  // Fetch when dependencies change
  useEffect(() => {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      search: filters.search,
    };
    if (sortConfig.key) {
      params.sortBy = sortConfig.key;
      params.sortOrder = sortConfig.direction;
    }
    dispatch(fetchAllServiceCategories(params)).unwrap().catch((err) => {
      toast.error(err?.message || "Failed to fetch service categories");
    });
  }, [
    dispatch,
    pagination.page,
    pagination.limit,
    filters.search,
    sortConfig.key,
    sortConfig.direction,
  ]);

  // cleanup on unmount (optional)
  useEffect(() => {
    return () => {
      dispatch(resetPagination());
      dispatch(resetFilters());
      dispatch(resetSortConfig());
    };
  }, [dispatch]);

  const sortedData = useMemo(() => {
    // server already handles sorting if you passed params; keep fallback local sort for safety:
    if (!sortConfig.key) return serviceCategory || [];
    const dataCopy = [...(serviceCategory || [])];
    dataCopy.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return dataCopy;
  }, [serviceCategory, sortConfig]);

  const totalPages = Math.ceil((pagination.total || 0) / pagination.limit);
  const startIndex = (pagination.page - 1) * pagination.limit;

  const handleSort = (key) => {
    const newDirection =
      sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    dispatch(setSortConfig({ key, direction: newDirection }));
  };

  const handleSearchChange = (value) => {
    dispatch(setFilters({ search: value }));
    dispatch(setPagination({ page: 1 }));
  };

  const handlePageChange = (newPage) => {
    dispatch(setPagination({ page: newPage }));
  };

  const handleItemsPerPageChange = (newLimit) => {
    setLocalEntries(newLimit);
    dispatch(setPagination({ limit: newLimit, page: 1 }));
  };

  const confirmDelete = async () => {
    try {
      await dispatch(deleteServiceCategory(deleteModalData.id || deleteModalData._id)).unwrap();
      toast.success("Service category deleted successfully");
      setDeleteModalData(null);
      // refetch - thunk will be called automatically when pagination/search state is same; else call explicitly
      dispatch(fetchAllServiceCategories({
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
      }));
    } catch (err) {
      toast.error(err?.message || "Error deleting service category");
    }
  };

  return (
    <div className="bg-gray-50 mt-[5vh]">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search service categories..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">🔍</div>
          </div>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md" style={{ backgroundColor: "#574fdd" }} onClick={() => navigate("/servicecategory/add")}>
            Add
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>

                  <SortableHeader label="Service Category Name" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader label="Status" sortKey="is_active" sortConfig={sortConfig} onSort={handleSort} />
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort("name")}>
                    Name <span className="text-gray-400">{sortConfig.key === "name" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort("is_active")}>
                    Status <span className="text-gray-400">{sortConfig.key === "is_active" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}</span>
                  </th> */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {!loading && (serviceCategory || []).length === 0 ? (
                  <tr><td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">No data found</td></tr>
                ) : (
                  (serviceCategory || []).map((item, idx) => (
                    <tr key={item.id || item._id} className={`hover:bg-gray-50 ${idx % 2 === 1 ? "bg-gray-50" : ""}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{startIndex + idx + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{capitalizeFirst(item.name)}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><StatusBadge isActive={item.is_active} /></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><ActionButtons
                        item={item}
                        onView={() => setViewModalData(item)}
                        onEdit={true}
                        editPath={`/servicecategory/edit/${item.id}`}
                        onDelete={() => setDeleteModalData(item)} /></td>
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
            visibleItemCount={serviceCategory.length}
            listType={true}
          />
        </div>
      </div>

      {/* View modal */}
      {viewModalData && (
        <ViewModal
          viewModalData={viewModalData}
          onClose={() => setViewModalData(null)}
        />
      )}

      {/* Delete modal */}
      {deleteModalData && (

        <DeleteModal
          deleteModalData={deleteModalData}
          onCancel={() => setDeleteModalData(null)}
          confirmDelete={confirmDelete}
        />
      )}
    </div>
  );
};

export default ServiceCategoryList;
