import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllVendors,
  deleteVendor,
  setFilters,
  setPagination,
  setSortConfig as setReduxSortConfig,
  resetFilters,
  resetSortConfig,
  resetPagination,
} from "../../../reducer/vendorReducer";
import { toast } from "react-toastify";
import StatusBadge from "../../components/StatusBadge";
import ViewModal from "./ViewModal";
import SortableHeader from "../../components/SortableHeader";
import DeleteModal from "../../components/DeleteModal";
import Pagination from "../../components/Pagination";
import ActionButtons from "../../components/ActionButtons";

const VendorsList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [viewModalData, setViewModalData] = useState(null);
  const [deleteModalData, setDeleteModalData] = useState(null);

  // Redux state
  const { vendors, loading, pagination, filters, sortConfig } = useSelector(
    (state) => state.vendor
  );

  // Clear filters when component unmounts
  useEffect(() => {
    return () => {
      dispatch(resetPagination());
      dispatch(resetFilters());
      dispatch(resetSortConfig());
    };
  }, [dispatch]);

  // Fetch vendors on mount and when filters/pagination/sorting change
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

        // Add filters
        if (filters.is_active !== "") {
          params.is_active = filters.is_active;
        }

        await dispatch(fetchAllVendors(params)).unwrap();
      } catch (error) {
        toast.error(error?.message || "Failed to fetch vendors");
      }
    };

    fetchData();
  }, [
    dispatch,
    pagination.page,
    pagination.limit,
    filters.search,
    filters.is_active,
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

  // Check if any filters are active
  const hasActiveFilters = filters.search || sortConfig.key;

  const confirmDelete = async () => {
    try {
      await dispatch(deleteVendor(deleteModalData.id)).unwrap();
      toast.success("Vendor deleted successfully");

      // Refetch vendors after deletion
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
      };

      if (sortConfig.key) {
        params.sortBy = sortConfig.key;
        params.sortOrder = sortConfig.direction;
      }

      await dispatch(fetchAllVendors(params)).unwrap();
    } catch (error) {
      toast.error(error?.message || "Error deleting vendor");
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
              placeholder="Search vendor name..."
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
            onClick={() => navigate("/vendor/add")}
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
                    label="Supply Vendor Name"
                    sortKey="name"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Email"
                    sortKey="email"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Phone Number"
                    sortKey="mobile_no"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />

                  {/* <SortableHeader
                    label="Material Type"
                    sortKey="material_types"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  /> */}
                  <SortableHeader
                    label="Contract Type"
                    sortKey="contract_type"
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
                {!loading && vendors.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No data found
                    </td>
                  </tr>
                ) : (
                  vendors.map((item, idx) => (
                    <tr
                      key={item._id}
                      className={`hover:bg-gray-50 ${idx % 2 === 1 ? "bg-gray-50" : ""
                        }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {startIndex + idx + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.mobile_no}
                      </td>
                      {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.material_categories?.map((category) => category.name).join(", ")}
                      </td> */}
                      {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.material_types?.map((type) => type.name).join(", ")}
                      </td> */}

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {item.contract_type?.name || ""}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge isActive={item.is_active} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <ActionButtons
                          item={item}
                          onView={() => setViewModalData(item)}
                          onEdit={true}
                          editPath={`/vendor/edit/${item.id}`}
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
            visibleItemCount={vendors.length}
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

export default VendorsList;
