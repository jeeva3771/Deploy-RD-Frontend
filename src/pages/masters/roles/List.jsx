import axios from "axios";
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance, backendUrl } from "../../../utils/url/config";
import { useLoader } from "../../../context/LoaderContext";
import { toast } from "react-toastify";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PERMISSIONS from '../../../utils/permission/permission.json';

const RolesList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const [viewModalData, setViewModalData] = useState(null);
  const [deleteModalData, setDeleteModalData] = useState(null);

  const { showLoader, hideLoader } = useLoader();

  const PERMISSIONS_JSON = PERMISSIONS

  const fetchRolesList = useCallback(async () => {
    showLoader();
    try {
      const response = await axiosInstance.get(`${backendUrl}/role`, {
        params: {
          page: currentPage,
          limit: entriesPerPage,
          search: searchTerm,
        },
      });
      if (response.data.success) {
        setData(response.data.data || []);
        setTotalCount(response.data.total || 0);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching roles list");
    } finally {
      hideLoader();
    }
  }, [currentPage, entriesPerPage, searchTerm, showLoader, hideLoader]);

  useEffect(() => {
    fetchRolesList();
  }, [fetchRolesList]);

  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return data;
    const sorted = [...data].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === "permission") {
        aVal = Array.isArray(aVal) ? aVal.join(", ").toLowerCase() : "";
        bVal = Array.isArray(bVal) ? bVal.join(", ").toLowerCase() : "";
      } else if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [data, sortConfig]);

  const totalPages = Math.ceil(totalCount / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const StatusBadge = ({ isActive }) => (
    <span
      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
        }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );

  const SortableHeader = ({ label, sortKey }) => {
    const icon =
      sortConfig.key === sortKey
        ? sortConfig.direction === "asc"
          ? "↑"
          : "↓"
        : "";
    return (
      <th
        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
        onClick={() => handleSort(sortKey)}
      >
        <div className="flex items-center gap-1">
          {label} <span className="text-gray-400">{icon}</span>
        </div>
      </th>
    );
  };

  const ActionButtons = ({ item }) => {
    const buttonStyle = {
      width: 32,
      height: 32,
      borderRadius: 4,
      border: '1px solid #574fdd',
      backgroundColor: 'transparent',
      color: '#574fdd',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
    };

    const handleMouseEnter = (e) => {
      e.currentTarget.style.backgroundColor = '#ecebff';
    };

    const handleMouseLeave = (e) => {
      e.currentTarget.style.backgroundColor = 'transparent';
    };

    return (
      <div style={{ display: 'flex', gap: '6px' }}>
        {/* View */}
        <button
          title="View"
          onClick={() => setViewModalData(item)}
          style={buttonStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <VisibilityIcon fontSize="small" />
        </button>

        {/* Edit */}
        <button
          title="Edit"
          onClick={() => navigate(`/roles/edit/${item.id}`)}
          style={buttonStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <EditIcon fontSize="small" />
        </button>

        {/* Delete */}
        <button
          title="Delete"
          onClick={() => setDeleteModalData(item)}
          style={buttonStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <DeleteIcon fontSize="small" />
        </button>
      </div>
    );
  };


  const ViewModal = () => {
    if (!viewModalData) return null;

    const Row = ({ label, value, isStatus = false }) => (
      <div className="flex py-2 last:border-b-0 text-sm font-medium text-gray-600">
        <div className="w-32 flex-shrink-0 text-gray-800">{label}</div>
        <div className="w-4 flex-shrink-0">:</div>
        <div
          className={`flex-1 ml-4  ${["Created By", "Updated By"].includes(label) ? "capitalize" : ""
            }`}
        >
          {isStatus ? <StatusBadge isActive={value} /> : String(value)}
        </div>
      </div>
    );

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50 flex-shrink-0 sticky top-0 z-10">
            <h2 className="text-xl font-semibold text-blue-600">
              Role Details
            </h2>
            <button
              onClick={() => setViewModalData(null)}
              className="text-gray-400 hover:text-gray-600 text-2xl font-light w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
          </div>
          <div className="p-6 space-y-2 overflow-y-auto overflow-x-auto flex-1">
            <Row label="Name" value={viewModalData.name} />
            <Row
              label="Permissions"
              value={
                Array.isArray(viewModalData.permission)
                  ? viewModalData.permission
                    .map((id) => {
                      const match = PERMISSIONS_JSON.permissions.find(
                        (perm) => perm.permission === id
                      );
                      return match ? match.module : `Unknown (${id})`;
                    })
                    .join(", ")
                  : "-"
              }
            />

            <Row
              label="Status"
              value={viewModalData.is_active}
              isStatus={true}
            />
            <Row label="Created At" value={viewModalData.created_at} />
            <Row
              label="Created By"
              value={viewModalData.created_by?.name || "-"}
            />
            <Row label="Updated At" value={viewModalData.updated_at || "-"} />
            <Row
              label="Updated By"
              value={
                viewModalData.updated_by && viewModalData.updated_by.length > 0
                  ? (() => {
                    // Sort by date descending
                    const sorted = [...viewModalData.updated_by].sort(
                      (a, b) => new Date(b.date) - new Date(a.date)
                    );
                    const latest = sorted[0];
                    return latest.user?.name || "Unknown";
                  })()
                  : "No updates"
              }
            />
          </div>
          <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end flex-shrink-0 sticky bottom-0 z-10">
            <button
              onClick={() => setViewModalData(null)}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const DeleteModal = () => {
    if (!deleteModalData) return null;

    const confirmDelete = async () => {
      try {
        await axiosInstance.delete(`${backendUrl}/role/${deleteModalData.id}`);
        toast.success("Role deleted successfully");
        fetchRolesList();
      } catch (error) {
        toast.error(error.response?.data?.message || "Error deleting role");
      } finally {
        setDeleteModalData(null);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
              <span className="text-red-600 text-xl">⚠️</span>
            </div>
          </div>
          <div className="text-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Confirm Delete
            </h3>
            <p className="text-sm text-gray-500">
              Are you sure you want to delete the role "{deleteModalData.name}"?
              This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => setDeleteModalData(null)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisible = 3;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

    for (let i = start; i <= end; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-3 py-1 border-t border-gray-200 border-b border-gray-300 text-sm hover:bg-gray-100 ${currentPage === i
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "text-gray-700"
            }`}
        >
          {i}
        </button>
      );
    }
    return buttons;
  };

  return (
    <div className="bg-gray-50 mt-[5vh]">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">🔍</span>
            </div>
          </div>
          <button
            className="flex items-center px-4 py-2 text-white rounded-md"
            style={{ backgroundColor: "#574fdd" }}
            onClick={() => navigate("/roles/add")}
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
                  <SortableHeader label="Role Name" sortKey="name" />
                  <SortableHeader label="Permissions" sortKey="permission" />

                  <SortableHeader label="Status" sortKey="is_active" />
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No data found
                    </td>
                  </tr>
                ) : (
                  sortedData.map((item, idx) => (
                    <tr
                      key={item.id || item._id}
                      className={`hover:bg-gray-50 ${idx % 2 === 1 ? "bg-gray-50" : ""
                        }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {startIndex + idx + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                        {item.name}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                        {Array.isArray(item.permission)
                          ? item.permission
                            .map((id) => {
                              const match = PERMISSIONS_JSON.permissions.find(
                                (perm) => perm.permission === id
                              );
                              return match ? match.module : `Unknown (${id})`;
                            })
                            .join(", ")
                          : "-"}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge isActive={item.is_active} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <ActionButtons item={item} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 border-gray-200">
            <div className="flex items-center mb-4 sm:mb-0">
              <span className="text-sm text-gray-700 mr-2">Show</span>
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(parseInt(e.target.value, 10));
                  setCurrentPage(1);
                }}
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
              {Math.min(startIndex + sortedData.length, totalCount)} of{" "}
              {totalCount} entries
            </div>
            <div className="flex items-center">
              <button
                onClick={() =>
                  currentPage > 1 && setCurrentPage(currentPage - 1)
                }
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-l-md text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {renderPaginationButtons()}
              <button
                onClick={() =>
                  currentPage < totalPages && setCurrentPage(currentPage + 1)
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-r-md text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
      <ViewModal />
      <DeleteModal />
    </div>
  );
};

export default RolesList;
