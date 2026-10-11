import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllUnits,
  deleteUnit,
  setFilters,
  setPagination,
  setSortConfig as setReduxSortConfig,
} from "../../../reducer/unitReducer";
import { toast } from "react-toastify";
import { capitalizeFirst } from "../../../utils/helper/capitalize";
import ActionButtons from "../../components/ActionButtons";
import SortableHeader from "../../components/SortableHeader";
import Pagination from "../../components/Pagination";
import DeleteModal from "../../components/DeleteModal";
import StatusBadge from "../../components/StatusBadge";
import ViewModal from "./ViewModal";
import {
  resetFilters,
  resetSortConfig,
  resetPagination,
} from "../../../reducer/unitReducer";

const UnitList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [viewModalData, setViewModalData] = useState(null);
  const [deleteModalData, setDeleteModalData] = useState(null);

  // Redux state
  const { units, loading, pagination, filters, sortConfig } = useSelector(
    (state) => state.unit
  );

  // Fetch units on mount and when filters/pagination/sorting change
  useEffect(() => {
    const fetchData = async () => {
      try {
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

        await dispatch(fetchAllUnits({ params })).unwrap();
      } catch (error) {
        toast.error(error?.message || "Failed to fetch units");
      }
    };

    fetchData();
  }, [dispatch, pagination.page, pagination.limit, filters.search, sortConfig]);

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
      await dispatch(deleteUnit(deleteModalData.id)).unwrap();
      toast.success("Unit deleted successfully");

      // Refetch units after deletion
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
      };

      if (sortConfig.key) {
        params.sortBy = sortConfig.key;
        params.sortOrder = sortConfig.direction;
      }

      await dispatch(fetchAllUnits(params)).unwrap();
    } catch (error) {
      toast.error(error?.message || "Error deleting unit");
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
              placeholder="Search si symbol..."
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
            onClick={() => navigate("/unit/add")}
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
                    label="SI Unit"
                    sortKey="si_unit"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="SI Symbol"
                    sortKey="name"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Parameters"
                    sortKey="values"
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
                {!loading && units.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No units found
                    </td>
                  </tr>
                ) : (
                  units.map((item, idx) => (
                    <tr
                      key={item.id || item._id}
                      className={`hover:bg-gray-50 ${idx % 2 === 1 ? "bg-gray-50" : ""
                        }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {startIndex + idx + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {capitalizeFirst(item.si_unit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                        <div
                          className="truncate"
                          title={
                            Array.isArray(item.values)
                              ? item.values.join(", ")
                              : ""
                          }
                        >
                          {capitalizeFirst(
                            Array.isArray(item.values)
                              ? item.values.join(", ")
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
                          editPath={`/unit/edit/${item.id}`}
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
            visibleItemCount={units.length}
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

export default UnitList;
