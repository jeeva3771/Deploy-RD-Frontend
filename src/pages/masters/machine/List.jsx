import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllMachines,
  deleteMachine,
  setFilters,
  setPagination,
  setSortConfig as setReduxSortConfig,
  resetFilters,
  resetSortConfig,
  resetPagination,
} from "../../../reducer/machineReducer";
import { toast } from "react-toastify";
import { capitalizeFirst } from "../../../utils/helper/capitalize";
import ActionButtons from "../../components/ActionButtons";
import SortableHeader from "../../components/SortableHeader";
import Pagination from "../../components/Pagination";
import DeleteModal from "../../components/DeleteModal";
import StatusBadge from "../../components/StatusBadge";
import ViewModal from "./ViewModal";

const MachinesList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [viewModalData, setViewModalData] = useState(null);
  const [deleteModalData, setDeleteModalData] = useState(null);

  // Redux state
  const { machines, loading, pagination, filters, sortConfig } = useSelector(
    (state) => state.machine
  );

  // Fetch machines on mount and when filters/pagination/sorting change
  useEffect(() => {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      search: filters.search,
    };

    // Add sorting parameters if available
    if (sortConfig.key) {
      params.sortBy = sortConfig.key;
      params.sortOrder = sortConfig.direction;
    }

    // Add filters
    if (filters.department) {
      params.department = filters.department;
    }
    if (filters.is_active !== "") {
      params.is_active = filters.is_active;
    }
    if (filters.type) {
      params.type = filters.type;
    }

    const promise = dispatch(fetchAllMachines(params));

    promise.unwrap().catch((error) => {
      if (
        error?.name !== "CanceledError" &&
        error?.name !== "AbortError" &&
        error?.message !== "canceled"
      ) {
        toast.error(error?.message || "Failed to fetch machines");
      }
    });

    return () => {
      promise.abort();
    };
  }, [
    dispatch,
    pagination.page,
    pagination.limit,
    filters.search,
    filters.department,
    filters.is_active,
    filters.type,
    sortConfig,
  ]);

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

    dispatch(setReduxSortConfig({ key, direction: newDirection }));
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
      await dispatch(deleteMachine(deleteModalData.id)).unwrap();
      toast.success("Machine deleted successfully");

      // Refetch machines after deletion
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
      };

      if (sortConfig.key) {
        params.sortBy = sortConfig.key;
        params.sortOrder = sortConfig.direction;
      }

      await dispatch(fetchAllMachines(params)).unwrap();
    } catch (error) {
      toast.error(error?.message || "Error deleting machine");
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
              placeholder="Search machine name..."
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
            onClick={() => navigate("/machine/add")}
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
                    label="Machine Name"
                    sortKey="name"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Machine Number"
                    sortKey="machine_number"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Department"
                    sortKey="department"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Maintenance"
                    sortKey="maintanence"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
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
                {!loading && machines.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No data found
                    </td>
                  </tr>
                ) : (
                  machines.map((item, idx) => (
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {capitalizeFirst(item.machine_number)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {capitalizeFirst(item.department?.name)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                        <div
                          className="truncate"
                          title={
                            Array.isArray(item.maintanence)
                              ? item.maintanence.join(", ")
                              : ""
                          }
                        >
                          {capitalizeFirst(
                            Array.isArray(item.maintanence)
                              ? item.maintanence.join(", ")
                              : ""
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge isActive={item.is_active} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <ActionButtons
                          item={item}
                          onView={() => setViewModalData(item)}
                          onEdit={true}
                          editPath={`/machine/edit/${item.id}`}
                          onDelete={() => setDeleteModalData(item)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200">
            <div className="flex items-center mb-4 sm:mb-0">
              <span className="text-sm text-gray-700 mr-2">Show</span>
              <select
                value={pagination.limit}
                onChange={(e) =>
                  handleItemsPerPageChange(parseInt(e.target.value, 10))
                }
                className="border border-gray-300 rounded-md text-sm py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {[5, 10, 25, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-700 ml-2">entries</span>
            </div>
            <div className="text-sm text-gray-700 mb-4 sm:mb-0">
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + machines.length, pagination.total)} of{" "}
              {pagination.total} entries
            </div>
            <div className="flex items-center">
              <button
                onClick={() =>
                  pagination.page > 1 && handlePageChange(pagination.page - 1)
                }
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded-l-md text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {renderPaginationButtons()}
              <button
                onClick={() =>
                  pagination.page < pagination.totalPages &&
                  handlePageChange(pagination.page + 1)
                }
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded-r-md text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div> */}
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={pagination.limit}
            onItemsPerPageChange={handleItemsPerPageChange}
            totalCount={pagination.total}
            startIndex={startIndex}
            visibleItemCount={machines.length}
            listType={true}
          />
        </div>
      </div>
      <ViewModal
        viewModalData={viewModalData}
        onClose={() => setViewModalData(null)}
      />
      <DeleteModal
        deleteModalData={deleteModalData}
        onCancel={() => setDeleteModalData(null)}
        confirmDelete={confirmDelete}
      />
    </div>
  );
};

export default MachinesList;
