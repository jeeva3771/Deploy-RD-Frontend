import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance, backendUrl } from "../../../utils/url/config";
import { useLoader } from "../../../context/LoaderContext";
import { toast } from "react-toastify";
import { capitalizeFirst } from "../../../utils/helper/capitalize";
import ActionButtons from "../../components/ActionButtons";
import ViewModal from "./ViewModal";
import SortableHeader from "../../components/SortableHeader";
import StatusBadge from "../../components/StatusBadge"
import DeleteModal from "../../components/DeleteModal";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllDepartments,
  deleteDepartment,
  setPagination,
  resetFilters,
  resetSortConfig,
  resetPagination,
  setFilters,
  setSortConfig as setReduxSortConfig
} from "../../../reducer/departmentReducer";
import Pagination from "../../components/Pagination";

const DepartmentsList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState("");

  const [viewModalData, setViewModalData] = useState(null);
  const [deleteModalData, setDeleteModalData] = useState(null);

  const { showLoader, hideLoader } = useLoader();

  const { departments, loading, pagination, filters, sortConfig } = useSelector(state => state.department);

  console.log('departments', departments)

  const fetchDepartmentsList = useCallback(async () => {
    showLoader();
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
      }

      // Add sorting parameters if available
      if (sortConfig.key) {
        params.sortField = sortConfig.key;
        params.sortOrder = sortConfig.direction;
      }
      await dispatch(getAllDepartments({ params }));
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Error fetching departments list"
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
    fetchDepartmentsList();
  }, [fetchDepartmentsList]);

  useEffect(() => { return () => { dispatch(resetFilters()); dispatch(resetSortConfig()); dispatch(resetPagination()) }; }, [dispatch]);

  const startIndex = (pagination.page - 1) * pagination.limit;

  console.log('startIndex', pagination, startIndex)

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

    dispatch(setReduxSortConfig({ key, direction: newDirection }));
  };

  const confirmDelete = async () => {
    try {
      await dispatch(deleteDepartment(deleteModalData.id)).unwrap();
      toast.success("Department deleted successfully");
      fetchDepartmentsList();
    } catch (error) {
      toast.error(error || "Error deleting department");
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
              placeholder="Search departments..."
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
            onClick={() => navigate("/departments/add")}
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
                  <SortableHeader label="Department Name" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />
                  {/* <SortableHeader
                    label="Process Under This Department"
                    sortKey="under_process" sortConfig={sortConfig} onSort={handleSort}
                  /> */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Process Under This Department</th>
                  <SortableHeader label="Type" sortKey="type" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader label="Status" sortKey="is_active" sortConfig={sortConfig} onSort={handleSort} />
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {departments.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No data found
                    </td>
                  </tr>
                ) : (
                  departments.map((item, idx) => (
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
                      <td className="px-6 py-4 whitespace-normal break-words text-sm text-gray-500">
                        {capitalizeFirst(
                          Array.isArray(item.under_process)
                            ? item.under_process.join(", ")
                            : ""
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge isActive={item.is_active} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <ActionButtons
                          item={item}
                          onView={(item) => setViewModalData(item)}
                          onEdit={true}
                          editPath={`/departments/edit/${item.id}`}
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
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={pagination.limit}
            onItemsPerPageChange={handleItemsPerPageChange}
            totalCount={pagination.total}
            startIndex={startIndex}
            visibleItemCount={departments.length}
            listType={true}
          />
        </div>
      </div>
      <ViewModal viewModalData={viewModalData} onClose={() => setViewModalData(null)} />
      <DeleteModal
        deleteModalData={deleteModalData}
        onCancel={() => setDeleteModalData(null)}
        confirmDelete={confirmDelete} />
    </div>
  );
};

export default DepartmentsList;
