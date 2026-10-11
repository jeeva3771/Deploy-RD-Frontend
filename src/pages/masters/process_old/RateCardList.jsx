import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../../../utils/url/config";
import { useLoader } from "../../../context/LoaderContext";
import { toast } from "react-toastify";
import { capitalizeFirst } from "../../../utils/helper/capitalize";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllRateCards,
  setFilters,
  setPagination,
  setSortConfig,
  deleteRateCard,
  resetPagination,
  resetFilters,
  resetSortConfig
} from "../../../reducer/rateCardReducer";
import ActionButtons from "../../components/ActionButtons";
import SortableHeader from "../../components/SortableHeader";
import Pagination from "../../components/Pagination";
import DeleteModal from "../../components/DeleteModal";
import StatusBadge from "../../components/StatusBadge";
import RateCardViewModal from "./RateCardViewModal";

const RateCardList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [viewModalData, setViewModalData] = useState(null);
  const [deleteModalData, setDeleteModalData] = useState(null);

  const { showLoader, hideLoader } = useLoader();

  const {
    rateCards,
    isLoading,
    error,
    successMessage,
    pagination,
    filters,
    sortConfig
  } = useSelector(state => state.rateCard);

  const fetchRateCardList = useCallback(async () => {
    showLoader();
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
      };

      if (sortConfig.key) {
        params.sortField = sortConfig.key;
        params.sortOrder = sortConfig.direction;
      }

      await dispatch(getAllRateCards({ is_active: undefined, order: "asc", params }));
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Error fetching rate card list"
      );
    } finally {
      hideLoader();
    }
  }, [
    dispatch,
    pagination.page,
    pagination.limit,
    filters.search,
    sortConfig.key,
    sortConfig.direction,
    showLoader,
    hideLoader
  ]);

  useEffect(() => {
    fetchRateCardList();
  }, [fetchRateCardList]);

  useEffect(() => {
    return () => {
      dispatch(resetPagination());
      dispatch(resetFilters());
      dispatch(resetSortConfig());
    };
  }, [dispatch]);

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
    dispatch(setPagination({ limit: newLimit, page: 1 }));
  };

  const confirmDelete = async () => {
    try {
      await dispatch(deleteRateCard(deleteModalData.id));
      fetchRateCardList();
      toast.success("Rate card deleted successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error deleting rate card");
    } finally {
      setDeleteModalData(null);
    }
  };

  return (
    <div className="bg-gray-50 mt-[5vh]">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search rate cards..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">🔍</span>
            </div>
          </div>
          <button
            className="flex items-center px-4 py-2 text-white rounded-md"
            style={{ backgroundColor: "#574fdd" }}
            onClick={() => navigate("/ratecard/add")}
          >
            <i className="fa-solid fa-plus mr-2"></i>Add
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    S.No
                  </th>
                  <SortableHeader
                    label="Process"
                    sortKey="process_id"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Vendor"
                    sortKey="vendor"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Rate Unit"
                    sortKey="rate_unit"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variable Rates
                  </th>
                  <SortableHeader
                    label="Status"
                    sortKey="is_active"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rateCards.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No data found
                    </td>
                  </tr>
                ) : (
                  rateCards.map((item, idx) => (
                    <tr
                      key={item.id || item._id}
                      className={`hover:bg-gray-50 ${idx % 2 === 1 ? "bg-gray-50" : ""
                        }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {startIndex + idx + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.process?.service_category?.name
                          ? capitalizeFirst(item.process.service_category.name)
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.is_internal ? "Internal Vendor" : item.vendor ? `${item.vendor?.name} - ${item.vendor?.contract_type?.name} ` : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.rate_unit || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item.variable_rates?.length || 0} rates
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge isActive={item.is_active} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <ActionButtons
                          item={item}
                          onView={() => setViewModalData(item)}
                          onEdit={true}
                          editPath={`/ratecard/edit/${item.id}`}
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
            visibleItemCount={rateCards.length}
            listType={true}
          />
        </div>
      </div>
      <RateCardViewModal
        viewModalData={viewModalData}
        onClose={() => setViewModalData(null)}
      />
      <DeleteModal
        deleteModalData={deleteModalData ? { ...deleteModalData, name: deleteModalData.process.service_category.name } : null}
        onCancel={() => setDeleteModalData(null)}
        confirmDelete={confirmDelete}
      />
    </div>
  );
};

export default RateCardList;
