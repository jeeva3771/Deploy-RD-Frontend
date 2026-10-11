import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import moment from "moment";
import { fetchCompaniesList, deleteCompany } from "../../../reducer/companyReducer";
import Pagination from "../../components/Pagination";

const CompanyList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    companiesList,
    totalCount,
    totalPages,
    currentPage: storeCurrentPage,
    loading,
  } = useSelector((state) => state.company);

  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModalData, setDeleteModalData] = useState(null);
  const [viewModalData, setViewModalData] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });

  useEffect(() => {
    dispatch(
      fetchCompaniesList({
        page: currentPage,
        limit: entriesPerPage,
        search: searchTerm,
        sortKey: sortConfig.key,
        sortDir: sortConfig.direction,
      })
    );
  }, [dispatch, currentPage, entriesPerPage, searchTerm, sortConfig]);

  const startIndex = (currentPage - 1) * entriesPerPage;

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

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

  const StatusBadge = ({ isActive }) => (
    <span
      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
        }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );

  const ActionButtons = ({ item }) => {
    const buttonStyle = {
      width: 32,
      height: 32,
      borderRadius: 4,
      border: "1px solid #574fdd",
      backgroundColor: "transparent",
      color: "#574fdd",
      cursor: "pointer",
      transition: "background-color 0.2s ease",
    };

    const handleMouseEnter = (e) => {
      e.currentTarget.style.backgroundColor = "#ecebff";
    };

    const handleMouseLeave = (e) => {
      e.currentTarget.style.backgroundColor = "transparent";
    };

    return (
      <div style={{ display: "flex", gap: "6px" }}>
        <button
          title="View"
          onClick={() => setViewModalData(item)}
          style={buttonStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <VisibilityIcon fontSize="small" />
        </button>

        <button
          title="Edit"
          onClick={() => navigate(`/company/edit/${item._id}`)}
          style={buttonStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <EditIcon fontSize="small" />
        </button>

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
          className={`flex-1 ml-4 ${["Created By", "Updated By"].includes(label) ? "capitalize" : ""
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
              Company Details
            </h2>
            <button
              onClick={() => setViewModalData(null)}
              className="text-gray-400 hover:text-gray-600 text-2xl font-light w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
          </div>
          <div className="p-6 space-y-2 overflow-y-auto overflow-x-auto flex-1">
            <Row label="Company Name" value={viewModalData.company_name} />
            <Row
              label="Status"
              value={viewModalData.is_active}
              isStatus={true}
            />
            <Row
              label="Created At"
              value={
                viewModalData.createdAt
                  ? moment(viewModalData.createdAt).format("DD-MM-YYYY HH:mm:ss")
                  : "-"
              }
            />
            <Row
              label="Created By"
              value={viewModalData.created_by?.name || "-"}
            />
            <Row
              label="Updated At"
              value={
                viewModalData.updatedAt
                  ? moment(viewModalData.updatedAt).format("DD-MM-YYYY HH:mm:ss")
                  : "-"
              }
            />
            <Row
              label="Updated By"
              value={viewModalData.updated_by?.name || "-"}
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
        await dispatch(deleteCompany(deleteModalData._id)).unwrap();
        toast.success("Company deleted successfully");
        dispatch(fetchCompaniesList({ page: currentPage, limit: entriesPerPage, search: searchTerm }));
      } catch (error) {
        toast.error(error || "Error deleting company");
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
              Are you sure you want to delete the company "{deleteModalData.company_name}"?
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

  return (
    <div className="bg-gray-50 mt-[5vh]">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search companies..."
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
            onClick={() => navigate("/company/add")}
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
                  <SortableHeader label="Company Name" sortKey="company_name" />
                  <SortableHeader label="Status" sortKey="is_active" />
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : companiesList.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                      No data found
                    </td>
                  </tr>
                ) : (
                  companiesList.map((item, idx) => (
                    <tr
                      key={item._id}
                      className={`hover:bg-gray-50 ${idx % 2 === 1 ? "bg-gray-50" : ""}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {startIndex + idx + 1}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 break-words max-w-[300px]">
                        {item.company_name}
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

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={entriesPerPage}
            onItemsPerPageChange={setEntriesPerPage}
            totalCount={totalCount}
            startIndex={startIndex}
            visibleItemCount={companiesList.length}
            listType={true}
          />
        </div>
      </div>
      <ViewModal />
      <DeleteModal />
    </div>
  );
};

export default CompanyList;