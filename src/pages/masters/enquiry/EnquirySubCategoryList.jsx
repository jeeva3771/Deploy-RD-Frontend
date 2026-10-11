import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance, backendUrl } from "../../../utils/url/config";
import { useLoader } from "../../../context/LoaderContext";
import { toast } from "react-toastify";
import { capitalizeFirst } from "../../../utils/helper/capitalize";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ActionButtons from "../../components/ActionButtons";
import EnquirySubCategoryViewModal from "./EnquirySubCategoryViewModal";
import SortableHeader from "../../components/SortableHeader";
import StatusBadge from "../../components/StatusBadge"
import DeleteModal from "../../components/DeleteModal";
import { useDispatch, useSelector } from "react-redux";
import Pagination from "../../components/Pagination";
import {
  getAllEnquirySubCategories,
  deleteEnquirySubCategory,
  setPagination,
  resetFilters,
  resetPagination,
  resetSortConfig,
  setSortConfig,
  setFilters
} from "../../../reducer/enquirySubCategoryReducer";

const EnquirysubCategoryList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [totalCount, setTotalCount] = useState(0);

  const [viewModalData, setViewModalData] = useState(null);
  const [deleteModalData, setDeleteModalData] = useState(null);

  const { showLoader, hideLoader } = useLoader();

  const {
    enquirySubCategories,
    isLoading,
    error,
    successMessage,
    sortConfig,
    filters,
    pagination } = useSelector(state => state.enquirySubCategories)

  const fetchEnquirysubCategoryList = useCallback(async () => {
    showLoader();
    try {
      let params = {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
      }
      // Add sorting parameters if available
      if (sortConfig.key) {
        params.sortField = sortConfig.key;
        params.sortOrder = sortConfig.direction;
      }
      await dispatch(getAllEnquirySubCategories({ params }));

    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Error fetching enquiry category list"
      );
    } finally {
      hideLoader();
    }
  }, [
    dispatch,
    pagination.page,
    pagination.limit,
    sortConfig.key,
    sortConfig.direction,
    filters.search,
    showLoader,
    hideLoader
  ]);

  useEffect(() => {
    fetchEnquirysubCategoryList();
  }, [fetchEnquirysubCategoryList]);

  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const startIndex = (pagination.page - 1) * pagination.limit;

  useEffect(() => { return () => { dispatch(resetFilters()); dispatch(resetSortConfig()); dispatch(resetPagination()) }; }, [dispatch]);

  const handlePageChange = (newPage) => {
    dispatch(setPagination({ page: newPage }));
  };

  const handleItemsPerPageChange = (newLimit) => {
    dispatch(setPagination({ limit: newLimit, page: 1 }));
  };

  const handleSearchChange = (value) => {
    dispatch(setFilters({ search: value }));
    dispatch(setPagination({ page: 1 }));
  };

  const handleSort = (key) => {
    const newDirection =
      sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";

    dispatch(setSortConfig({ key, direction: newDirection }));
  };

  const confirmDelete = async () => {
    try {
      await dispatch(
        deleteEnquirySubCategory(deleteModalData.id)
      );
      fetchEnquirysubCategoryList();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Error deleting enquiry category"
      );
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
              placeholder="Search sub-categories..."
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
            onClick={() => navigate("/EnquirysubCategory/add")}
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
                  <SortableHeader label="Name" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader label="Status" sortKey="is_active" sortConfig={sortConfig} onSort={handleSort} />
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {enquirySubCategories.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No data found
                    </td>
                  </tr>
                ) : (
                  enquirySubCategories.map((item, idx) => (
                    <tr
                      key={item.id || item._id}
                      className={`hover:bg-gray-50 ${idx % 2 === 1 ? "bg-gray-50" : ""
                        }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {startIndex + idx + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {capitalizeFirst(item.name)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge isActive={item.is_active} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <ActionButtons
                          item={item}
                          onView={(item) => setViewModalData(item)}
                          onEdit={true}
                          editPath={`/enquirysubcategory/edit/${item.id}`}
                          onDelete={(item) => setDeleteModalData(item)}
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
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={pagination.limit}
            onItemsPerPageChange={handleItemsPerPageChange}
            totalCount={pagination.total}
            startIndex={startIndex}
            visibleItemCount={enquirySubCategories.length}
            listType={true}
          />

        </div>
      </div>
      <EnquirySubCategoryViewModal viewModalData={viewModalData} onClose={() => setViewModalData(null)} />
      <DeleteModal
        deleteModalData={deleteModalData}
        onCancel={() => setDeleteModalData(null)}
        confirmDelete={confirmDelete} />
    </div>
  );
};

export default EnquirysubCategoryList;
