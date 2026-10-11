import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import ProcessForm from "./ProcessForm";

import {
  getAllProcesses,
  setFilters,
  setPagination,
  setSortConfig,
  deleteProcess,
  resetPagination,
  resetFilters,
  resetSortConfig,
  createProcess,
  updateProcess,
} from "../../../reducer/processReducer";

import { getAllDepartments } from "../../../reducer/departmentReducer";

import { useLoader } from "../../../context/LoaderContext";
import { capitalizeFirst } from "../../../utils/helper/capitalize";

import ActionButtons from "../../components/ActionButtons";
import SortableHeader from "../../components/SortableHeader";
import Pagination from "../../components/Pagination";
import DeleteModal from "../../components/DeleteModal";
import StatusBadge from "../../components/StatusBadge";
import {
  FormControl,
  Select,
  MenuItem,
  Switch,
} from "@mui/material";
import { fetchAllRateUnits } from "../../../reducer/inventory/common/rateUnitReducer";


const ProcessList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showLoader, hideLoader } = useLoader();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});


  const { processes, pagination, filters, sortConfig } = useSelector(
    (state) => state.process
  );
  const { rateUnits } = useSelector((state) => state.rateUnit);
  const { departments } = useSelector((state) => state.department);

  /* ================= FORM STATE ================= */
  const [formData, setFormData] = useState({
    name: "",
    rate: "",
    min_rate_slab_1: "",
    min_rate_slab_2: "",
    type: "",
    unit: "",
    department: "",
    linked_department: "",
    prompt: "",
    is_active: true,
    is_uv: false,
    mov: "",
    beds: [],
    is_outsource_open: true,
  });

  const handleAddBed = () => {
    setFormData(prev => ({
      ...prev,
      beds: [...(prev.beds || []), {
        width: "",
        height: "",
        bed_area: 0,
        rate: "",
        min_cycle_cost: 0
      }]
    }));
  };

  const handleBedChange = (index, field, value) => {
    const updatedBeds = [...formData.beds];
    updatedBeds[index][field] = value;

    const width = Number(updatedBeds[index].width || 0);
    const height = Number(updatedBeds[index].height || 0);
    const rate = Number(updatedBeds[index].rate || 0);

    const area = width * height;
    updatedBeds[index].bed_area = area;
    updatedBeds[index].min_cycle_cost = area * rate;

    setFormData(prev => ({ ...prev, beds: updatedBeds }));
  };

  const removeBed = (index) => {
    const updated = [...formData.beds];
    updated.splice(index, 1);
    setFormData((prev) => ({ ...prev, beds: updated }));
  };

  const [processId, setProcessId] = useState(null);
  const [deleteModalData, setDeleteModalData] = useState(null);

  /* ================= FETCH LIST ================= */
  const fetchProcessList = useCallback(async () => {
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

      await dispatch(getAllProcesses({ params }));
    } catch {
      toast.error("Error fetching process list");
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
    hideLoader,
  ]);

  useEffect(() => {
    fetchProcessList();
  }, [fetchProcessList]);

  useEffect(() => {
    // return () => {
    dispatch(resetPagination());
    dispatch(resetFilters());
    dispatch(resetSortConfig());
    dispatch(fetchAllRateUnits());
    dispatch(getAllDepartments({ is_active: true, order: "asc" }));
    // };
  }, [dispatch]);

  /* ================= HANDLERS ================= */
  const handleSort = (key) => {
    const direction =
      sortConfig.key === key && sortConfig.direction === "asc"
        ? "desc"
        : "asc";
    dispatch(setSortConfig({ key, direction }));
  };

  const handleSearchChange = (value) => {
    dispatch(setFilters({ search: value }));
    dispatch(setPagination({ page: 1 }));
  };

  const handlePageChange = (page) => {
    dispatch(setPagination({ page }));
  };

  const handleItemsPerPageChange = (limit) => {
    dispatch(setPagination({ limit, page: 1 }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim())
      newErrors.name = "Process name is required";

    if (!formData.rate || Number(formData.rate) <= 0)
      newErrors.rate = "Valid rate is required";

    if (!formData.min_rate_slab_1 || Number(formData.min_rate_slab_1) <= 0)
      newErrors.min_rate_slab_1 = "Valid min rate #1 is required";

    if (!formData.min_rate_slab_2 || Number(formData.min_rate_slab_2) <= 0)
      newErrors.min_rate_slab_2 = "Valid min rate #2 is required";

    if (!formData.type)
      newErrors.type = "Type is required";

    if (!formData.unit)
      newErrors.unit = "Unit is required";

    if (!formData.department)
      newErrors.department = "Department is required";

    if (!formData.linked_department)
      newErrors.linked_department = "Linked Department is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      rate: "",
      min_rate_slab_1: "",
      min_rate_slab_2: "",
      type: "",
      unit: "",
      department: "",
      linked_department: "",
      prompt: "",
      is_active: true,
      is_uv: false,
      mov: "",
      beds: [],
      is_outsource_open: true
    });
    setProcessId(null);
    setErrors({});
  };


  /* ================= CREATE / UPDATE ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateForm()) return;

    setIsSubmitting(true);
    showLoader();

    try {
      if (processId) {
        await dispatch(updateProcess({ id: processId, formData }));
        toast.success("Process updated successfully");
      } else {
        await dispatch(createProcess(formData));
        toast.success("Process created successfully");
      }

      fetchProcessList();
      resetForm();
      setErrors({});
    } catch {
      toast.error("Operation failed");
    } finally {
      hideLoader();
      setIsSubmitting(false);
    }
  };


  const confirmDelete = async () => {
    try {
      await dispatch(deleteProcess(deleteModalData.id));
      fetchProcessList();
      toast.success("Process deleted");
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleteModalData(null);
    }
  };


  const handleToggleOutsource = async (e, process) => {
    e.stopPropagation(); // prevent row click if needed
    try {
      const updatedValue = !process.is_outsource_open;
      // We only send the field we want to update to avoid overwriting other fields with stale state
      // However, the updateProcess thunk/API typically expects a full object or handles partials.
      // Based on controller: `const { updated_by, ...otherUpdates } = updateData;` it handles partials.

      await dispatch(updateProcess({
        id: process.id,
        formData: { is_outsource_open: updatedValue }
      }));

      // Optimistically update or re-fetch. Re-fetching is safer.
      fetchProcessList();
      toast.success("Outsource status updated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update outsource status");
    }
  };

  const startIndex = (pagination.page - 1) * pagination.limit;

  /* ================= JSX ================= */
  return (
    <div className="bg-gray-50 mt-[5vh]">
      <div className="container mx-auto px-4 py-6">

        {/* ===== HEADER BAR (SAME AS FIRST UI) ===== */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search processes..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              🔍
            </span>
          </div>


        </div>

        {/* ===== CREATE / EDIT FORM (CARD STYLE) ===== */}
        <ProcessForm
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          isSubmitting={isSubmitting}
          rateUnits={rateUnits}
          departments={departments}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          processId={processId}
          handleAddBed={handleAddBed}
          handleBedChange={handleBedChange}
          removeBed={removeBed}
        />

        {/* ===== TABLE (SAME STYLES AS FIRST) ===== */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <SortableHeader label="Name" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader label="Rate" sortKey="rate" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader label="Min Rate #1" sortKey="min_rate_slab_1" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader label="Min Rate #2" sortKey="min_rate_slab_2" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader label="Type" sortKey="type" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader label="Dept" sortKey="department" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader label="Linked Dept" sortKey="linked_department.name" sortConfig={sortConfig} onSort={handleSort} />
                  <th className="px-6 py-3 text-xs font-semibold tracking-wider text-left text-gray-500 uppercase cursor-pointer">
                    Outsource Open
                  </th>
                  <th className="px-6 py-3 text-xs text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>



              <tbody className="divide-y divide-gray-200">
                {processes.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {capitalizeFirst(item.name)}

                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {`${item.rate} /${item.unit?.symbol ? ` (${item.unit.symbol})` : ""}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {`${item.min_rate_slab_1} /${item.unit?.symbol ? ` (${item.unit.symbol})` : ""}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {`${item.min_rate_slab_2} /${item.unit?.symbol ? ` (${item.unit.symbol})` : ""}`}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                        {item.type}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                        {item.department}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                        {item.linked_department?.name || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Switch
                          checked={item.is_outsource_open || false}
                          onChange={(e) => handleToggleOutsource(e, item)}
                          color="primary"
                          size="small"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <ActionButtons
                          item={item}
                          onEdit={() => {
                            setFormData({
                              name: item.name,
                              rate: item.rate,
                              type: item.type,
                              min_rate_slab_1: item.min_rate_slab_1,
                              min_rate_slab_2: item.min_rate_slab_2,
                              unit: item.unit?._id || "",
                              department: item.department,
                              linked_department: item.linked_department?._id || item.linked_department || "",
                              prompt: item.prompt || "",
                              is_active: item.is_active,
                              is_uv: item.is_uv,
                              mov: item.mov,
                              beds: item.beds,
                              is_outsource_open: item.is_outsource_open,
                            });
                            setProcessId(item.id);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
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

      <DeleteModal
        deleteModalData={deleteModalData}
        onCancel={() => setDeleteModalData(null)}
        confirmDelete={confirmDelete}
      />
    </div>
  );
};

export default ProcessList;
