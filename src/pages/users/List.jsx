import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLoader } from "../../context/LoaderContext";
import { toast } from "react-toastify";
import { capitalizeFirst } from "../../utils/helper/capitalize";
import { useDispatch, useSelector } from 'react-redux';
import {
  deleteUser,
  fetchAllUsers,
  resetPagination,
  resetSortConfig,
  resetFilters,
  setSortConfig,
  setPagination,
  setFilters,
  bulkUploadUsers,
} from "../../reducer/userReducer";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ActionButtons from "../components/ActionButtons";
import ProfileImage from "./ProfileImage";
import ViewModal from "./ViewModal";
import DeleteModal from "../components/DeleteModal";
import RoleBadge from "./RoleBadge";
import Pagination from "../components/Pagination";
import SortableHeader from "../components/SortableHeader";
import { fetchCompaniesList } from "../../reducer/companyReducer";
import { fetchUserCounts } from "../../reducer/userReducer";
import { getAllDepartments } from "../../reducer/departmentReducer";
import TabCard from "../components/TabCard";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";


const UsersList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [viewModalData, setViewModalData] = useState(null);
  const [deleteModalData, setDeleteModalData] = useState(null);

  const [totalCount, setTotalCount] = useState(0);

  const { showLoader, hideLoader } = useLoader();

  const {
    users,
    loading,
    error,
    successMessage,
    pagination,
    filters,
    sortConfig,
    userCounts,
  } = useSelector((state) => state.user);
  const { companiesList } = useSelector((state) => state.company);
  const { departments } = useSelector((state) => state.department);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initialize directly from Redux state — handles remount when companiesList already loaded
  const [visibleTabs, setVisibleTabs] = useState(() => {
    return companiesList?.length > 0
      ? ["", ...companiesList.map(c => c._id)]
      : [""];
  });

  // Still sync if companiesList loads after mount (first ever load)
  useEffect(() => {
    if (companiesList?.length > 0) {
      setVisibleTabs(prev => {
        const allIds = ["", ...companiesList.map(c => c._id)];
        // Only add newly added companies; don't override user's manual unchecks
        // But since you want ALL shown by default always, just ensure new ones are included:
        const newTabs = allIds.filter(id => !prev.includes(id));
        return newTabs.length > 0 ? [...prev, ...newTabs] : prev;
      });
    }
  }, [companiesList]);

  const fetchUserList = useCallback(async () => {
    try {
      showLoader();
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        company_id: filters.company_id,
        department_id: filters.department_id,
        is_active: filters.is_active,
        sortField: sortConfig.key ? sortConfig.key : null,
        sortOrder: sortConfig.key ? sortConfig.direction : null
      }
      await dispatch(fetchAllUsers(params)).unwrap();
    } catch (error) {
      toast.error(error?.message || "Failed to fetch units");
    } finally {
      hideLoader();
    }
  }, [
    dispatch,
    pagination.page,
    pagination.limit,
    filters.search,
    filters.company_id,
    filters.department_id,
    filters.is_active,
    sortConfig.key,
    sortConfig.direction,
    showLoader,
    hideLoader]);

  useEffect(() => {
    fetchUserList();
  }, [fetchUserList]);

  useEffect(() => {
    dispatch(fetchUserCounts({ department_id: filters.department_id }));
  }, [dispatch, filters.department_id]);

  useEffect(() => {
    dispatch(fetchCompaniesList({ sortKey: "company_name", sortDir: "asc" }));
    dispatch(getAllDepartments({ params: { sortField: "name", sortOrder: "asc" } }));
  }, [dispatch]);

  useEffect(() => {
    if (companiesList?.length > 0) {
      setVisibleTabs(prev => {
        if (prev.length === 1 && prev[0] === "") {
          return ["", ...companiesList.map(c => c._id)];
        }
        return prev;
      });
    }
  }, [companiesList]);

  useEffect(() => {
    if (users && pagination) {
      setTotalCount(pagination.total)
    }
  }, [users, pagination])

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

  const handleCompanyChange = (value) => {
    dispatch(setFilters({ company_id: value }));
    dispatch(setPagination({ page: 1 }));
  };

  const handleDepartmentChange = (value) => {
    dispatch(setFilters({ department_id: value }));
    dispatch(setPagination({ page: 1 }));
  };

  const handleStatusTabChange = (value) => {
    // value will be 'all', 'active', 'inactive'
    const status = value === "all" ? "" : value === "active" ? "true" : "false";
    dispatch(setFilters({ is_active: status }));
    dispatch(setPagination({ page: 1 }));
  };

  const handleSort = (key) => {
    const newDirection =
      sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";

    dispatch(setSortConfig({ key, direction: newDirection }));
  };

  const totalPages = Math.ceil(totalCount / pagination.limit);
  const currentData = users;
  const startIndex = (pagination.page - 1) * pagination.limit;

  const handleView = (item) => {
    setViewModalData(item);
  };

  const handleDelete = (item) => {
    setDeleteModalData(item);
  };

  const confirmDelete = async () => {
    if (!deleteModalData?.id) {
      toast.error("Error: User ID not found");
      setDeleteModalData(null);
      return;
    }

    try {
      // Dispatch delete action and wait for it
      await dispatch(deleteUser(deleteModalData.id)).unwrap();
      // Close modal immediately after successful delete
      fetchUserList();
      dispatch(fetchUserCounts());
      setDeleteModalData(null);
    } catch (error) {
      toast.error(error || "Error deleting user");
      setDeleteModalData(null);
    }
  };

  const handleBulkUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      showLoader();
      const response = await dispatch(bulkUploadUsers(formData)).unwrap();
      toast.success(response.message || "Bulk upload successful");
      fetchUserList();
      dispatch(fetchUserCounts());
    } catch (error) {
      toast.error(error.message || "Bulk upload failed");
    } finally {
      hideLoader();
      e.target.value = null; // Clear file input
    }
  };

  return (
    <div className="bg-gray-50" style={{ marginBottom: "80px" }}>
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-6 bg-white p-4 rounded-lg shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
            {/* Search Bar */}
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute inset-y-0 left-0 left-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔍</span>
              </div>
            </div>

            {/* Department Filter */}
            <div className="w-full md:w-64">
              <FormControl fullWidth variant="outlined" size="small">
                <Select
                  value={filters.department_id}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  displayEmpty
                  className="bg-white rounded-lg border-gray-300"
                >
                  <MenuItem value="">All Departments</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept._id} value={dept._id}>
                      {capitalizeFirst(dept.name)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition whitespace-nowrap"
              style={{ backgroundColor: "#574fdd" }}
            >
              Manage Tabs
            </button>
            <div className="relative">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                id="bulk-upload-input"
                onChange={handleBulkUpload}
              />
              <label
                htmlFor="bulk-upload-input"
                className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors cursor-pointer"
                title="Bulk Upload Users"
              >
                <UploadFileIcon className="mr-1" sx={{ fontSize: 18 }} />
                <span>Bulk Upload</span>
              </label>
            </div>

            <button
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              style={{ backgroundColor: "#574fdd" }}
              onClick={() => navigate("/users/add")}
            >
              <span className="mr-2">+</span>
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Company Box View - Managed by visibleTabs */}
        <div className="mb-6">
          <TabCard
            tabs={[
              { label: `ALL (${userCounts?.all || 0})`, value: "" },
              ...(companiesList?.map(company => ({
                label: `${company.company_name} (${userCounts?.byCompany?.[company._id] || 0})`,
                value: company._id
              })) || [])
            ].filter(t => visibleTabs.includes(t.value))}
            activeValue={filters.company_id}
            onChange={handleCompanyChange}
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    S.No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <SortableHeader label="Name" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader label="Username" sortKey="username" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader label="Company" sortKey="company" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader label="Department" sortKey="department" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader label="Role" sortKey="role" sortConfig={sortConfig} onSort={handleSort} />
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentData.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="py-6 text-center text-gray-500 text-sm font-medium"
                    >
                      No data found
                    </td>
                  </tr>
                ) : (
                  currentData.map((item, index) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50 ${index % 2 === 1 ? "bg-gray-50" : ""
                        }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ProfileImage
                          src={item.image}
                          alt={item.name}
                          name={item.name}
                          size="large"
                          shape="circle"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {capitalizeFirst(item.name)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {capitalizeFirst(item.username)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {capitalizeFirst(item.company_id?.company_name)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {capitalizeFirst(item.department_id?.name)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap capitalize">
                        <RoleBadge role={item.role} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <ActionButtons
                          item={item}
                          onView={(item) => handleView(item)}
                          onEdit={true}
                          editPath={`/users/edit/${item.id}`}
                          onDelete={(item) => handleDelete(item)}
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
            visibleItemCount={currentData.length}
            listType={true}
          />
        </div>
      </div>

      <ViewModal viewModalData={viewModalData} onClose={() => setViewModalData(null)} />
      <DeleteModal deleteModalData={deleteModalData} onCancel={() => setDeleteModalData(null)} confirmDelete={confirmDelete} />

      {/* Tab Management Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 shadow-xl">
            <h3 className="text-lg font-bold mb-4">Select Companies to Display</h3>

            <div className="max-h-96 overflow-y-auto">
              {[
                { label: "ALL", value: "" },
                ...(companiesList?.map(c => ({ label: c.company_name, value: c._id })) || [])
              ].map((tab) => (
                <label
                  key={tab.value}
                  className="flex items-center mb-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={visibleTabs.includes(tab.value)}
                    onChange={() => {
                      if (visibleTabs.includes(tab.value)) {
                        setVisibleTabs(visibleTabs.filter((v) => v !== tab.value));
                      } else {
                        setVisibleTabs([...visibleTabs, tab.value]);
                      }
                    }}
                    className="mr-3 w-4 h-4"
                  />
                  <span className="font-medium">{tab.label}</span>
                </label>
              ))}

              <div className="flex justify-between gap-3 mt-6 pt-4 border-t">
                <button
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                  onClick={() => setIsModalOpen(false)}
                >
                  Close
                </button>

                <button
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  onClick={() => {
                    setVisibleTabs(["", ...companiesList.map(c => c._id)]);
                  }}
                >
                  Show All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersList;
