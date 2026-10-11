import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance, backendUrl } from "../../../utils/url/config";
import { useLoader } from "../../../context/LoaderContext";
import { toast } from "react-toastify";
import { capitalizeFirst } from "../../../utils/helper/capitalize";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllProcesses,
  setFilters,
  setPagination,
  setSortConfig,
  deleteProcess,
  resetPagination,
  resetFilters,
  resetSortConfig
} from "../../../reducer/processReducer";
import ActionButtons from "../../components/ActionButtons";
import SortableHeader from "../../components/SortableHeader";
import Pagination from "../../components/Pagination";
import DeleteModal from "../../components/DeleteModal";
import StatusBadge from "../../components/StatusBadge";
import ViewModal from "./ViewModal";

const ProcessList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  // const [searchTerm, setSearchTerm] = useState("");
  // const [entriesPerPage, setEntriesPerPage] = useState(5);
  // const [currentPage, setCurrentPage] = useState(1);
  // const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const [viewModalData, setViewModalData] = useState(null);
  const [deleteModalData, setDeleteModalData] = useState(null);

  const { showLoader, hideLoader } = useLoader();

  const {
    processes,
    isLoading,
    error,
    successMessage,
    pagination,
    filters,
    sortConfig } = useSelector(state => state.process);

  const fetchProcessList = useCallback(async () => {
    showLoader();
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
      }

      if (sortConfig.key) {
        params.sortField = sortConfig.key
        params.sortOrder = sortConfig.direction
      }
      await dispatch(getAllProcesses({ params }));
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Error fetching process list"
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
    fetchProcessList();
  }, [fetchProcessList]);

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
      await dispatch(deleteProcess(deleteModalData.id));
      fetchProcessList();
      toast.success("Process deleted successfully");
    } catch (error) {
      toast.error(error.response.data.message || "Error deleting process");
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
              placeholder="Search processes..."
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
            onClick={() => navigate("/process/add")}
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
                  <SortableHeader label="Service Category Name" sortKey="service_category_name" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader label="Type" sortKey="type" sortConfig={sortConfig} onSort={handleSort} />
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendors
                  </th>
                  <SortableHeader label="Status" sortKey="is_active" sortConfig={sortConfig} onSort={handleSort} />
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {processes.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No data found
                    </td>
                  </tr>
                ) : (
                  processes.map((item, idx) => (
                    <tr
                      key={item.id || item._id}
                      className={`hover:bg-gray-50 ${idx % 2 === 1 ? "bg-gray-50" : ""
                        }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {startIndex + idx + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {capitalizeFirst(item.service_category.name)}
                      </td>
                      {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.is_involves_raw_material ? "Yes" : "No"}
                      </td> */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.type}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                        {capitalizeFirst(

                          Array.isArray(item.available_vendors)
                            ? item.available_vendors.map((col) => capitalizeFirst(col.name)).join(", ")
                            : ""

                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge isActive={item.is_active} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <ActionButtons
                          item={item}
                          onView={() => setViewModalData(item)}
                          onEdit={true}
                          editPath={`/process/edit/${item.id}`}
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
            visibleItemCount={processes.length}
            listType={true}
          />

        </div>
      </div>
      <ViewModal
        viewModalData={viewModalData}
        onClose={() => setViewModalData(null)}
      />
      <DeleteModal
        deleteModalData={deleteModalData ? { ...deleteModalData, name: deleteModalData.service_category.name } : null}
        onCancel={() => setDeleteModalData(null)}
        confirmDelete={confirmDelete}
      />
    </div>
  );
};

export default ProcessList;
