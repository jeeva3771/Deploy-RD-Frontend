import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllOutsourceVendors,
  createOutsourceVendor,
  updateOutsourceVendor,
  deleteOutsourceVendor,
  setFilters,
  setPagination,
  setSortConfig as setReduxSortConfig,
  resetFilters,
  resetSortConfig,
  resetPagination,
} from "../../../reducer/outsourceVendorReducer";
import { getAllProcesses } from "../../../reducer/processReducer";
import { toast } from "react-toastify";
import StatusBadge from "../../components/StatusBadge";
import ViewModal from "./ViewModal";
import SortableHeader from "../../components/SortableHeader";
import DeleteModal from "../../components/DeleteModal";
import Pagination from "../../components/Pagination";
import ActionButtons from "../../components/ActionButtons";
import OutsourceVendorForm from "./Form";

const OutsourceVendorsList = () => {
  const dispatch = useDispatch();

  const [viewModalData, setViewModalData] = useState(null);
  const [deleteModalData, setDeleteModalData] = useState(null);

  const { outsourceVendors, loading, pagination, filters, sortConfig } = useSelector(
    (state) => state.outsourceVendor
  );
  const { processes, isLoading: processesLoading } = useSelector((state) => state.process);

  // Form State
  const [vendorId, setVendorId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp_no: "",
    has_gst: null,
    gst_no: "",
    process_type: [],
    address: "",
    isActive: null,
  });

  useEffect(() => {
    return () => {
      dispatch(resetPagination());
      dispatch(resetFilters());
      dispatch(resetSortConfig());
    };
  }, [dispatch]);

  useEffect(() => {
    dispatch(getAllProcesses({ is_active: true, order: "asc" }));
  }, [dispatch]);

  const fetchData = useCallback(async () => {
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
      };

      if (sortConfig.key) {
        params.sortBy = sortConfig.key;
        params.sortOrder = sortConfig.direction;
      }

      if (filters.is_active !== "") {
        params.is_active = filters.is_active;
      }

      await dispatch(fetchAllOutsourceVendors(params)).unwrap();
    } catch (error) {
      toast.error(error?.message || "Failed to fetch outsource vendors");
    }
  }, [dispatch, pagination.page, pagination.limit, filters.search, filters.is_active, sortConfig]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      await dispatch(deleteOutsourceVendor(deleteModalData.id)).unwrap();
      toast.success("Outsource vendor deleted successfully");
      fetchData();
    } catch (error) {
      toast.error(error?.message || "Error deleting outsource vendor");
    } finally {
      setDeleteModalData(null);
    }
  };

  // FORM HANDLERS
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "isActive") {
      setFormData((prev) => ({ ...prev, [name]: value === "active" }));
    } else if (name === "has_gst") {
      setFormData((prev) => ({ ...prev, [name]: value === "yes", gst_no: value === "no" ? "" : prev.gst_no }));
    } else if (name === "whatsapp_no") {
      const numericValue = value.replace(/\D/g, "").slice(0, 15);
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!formData.name.trim()) newErrors.name = "Vendor Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!emailRegex.test(formData.email))
      newErrors.email = "Please enter a valid email address";

    if (!formData.whatsapp_no)
      newErrors.whatsapp_no = "WhatsApp number is required";

    if (formData.has_gst === null)
      newErrors.has_gst = "Please select if vendor has GST";

    if (formData.has_gst === true && !formData.gst_no.trim())
      newErrors.gst_no = "GST Number is required";

    if (!formData.process_type || (Array.isArray(formData.process_type) && formData.process_type.length === 0))
      newErrors.process_type = "Process Type is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (formData.isActive === null)
      newErrors.isActive = "Please select Active or Inactive status";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      whatsapp_no: "",
      has_gst: null,
      gst_no: "",
      process_type: [],
      address: "",
      isActive: null,
    });
    setErrors({});
    setVendorId(null);
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name || "",
      email: item.email || "",
      whatsapp_no: item.whatsapp_no?.toString() || "",
      has_gst: item.has_gst ?? null,
      gst_no: item.gst_no || "",
      process_type: Array.isArray(item.process_type)
        ? item.process_type.map((p) => p._id || p.id)
        : (item.process_type?._id || item.process_type?.id ? [item.process_type._id || item.process_type.id] : []),
      address: item.address || "",
      isActive: item.is_active,
    });
    setVendorId(item.id || item._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the highlighted errors");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      whatsapp_no: Number(formData.whatsapp_no),
      has_gst: formData.has_gst,
      gst_no: formData.has_gst ? formData.gst_no.trim() : "",
      process_type: formData.process_type,
      address: formData.address.trim(),
      is_active: formData.isActive ? 1 : 0,
    };

    setIsSubmitting(true);
    try {
      if (vendorId) {
        await dispatch(updateOutsourceVendor({ id: vendorId, formData: payload })).unwrap();
        toast.success("Outsource vendor updated successfully");
      } else {
        await dispatch(createOutsourceVendor(payload)).unwrap();
        toast.success("Outsource vendor created successfully");
      }
      fetchData();
      resetForm();
    } catch (err) {
      toast.error(err?.message || "Failed to submit the vendor data");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 mt-[5vh]">
      <div className="container mx-auto px-4 py-6">
        
        {/* HEADER BAR */}
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
        </div>

        {/* CREATE / EDIT FORM (CARD STYLE) */}
        <OutsourceVendorForm
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          isSubmitting={isSubmitting}
          processes={processes}
          processesLoading={processesLoading}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          vendorId={vendorId}
          resetForm={resetForm}
        />

        {/* TABLE */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    S.No
                  </th>
                  <SortableHeader
                    label="Vendor Name"
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
                    sortKey="whatsapp_no"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Process Type"
                    sortKey="process_type"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
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
                {!loading && outsourceVendors.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No data found
                    </td>
                  </tr>
                ) : (
                  outsourceVendors.map((item, idx) => (
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.whatsapp_no}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {Array.isArray(item.process_type)
                          ? item.process_type.map((p) => p.name).join(", ")
                          : (item.process_type?.name || "")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.has_gst ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            GST ({item.gst_no})
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Labour
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge isActive={item.is_active} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <ActionButtons
                          item={item}
                          onView={() => setViewModalData(item)}
                          onEdit={() => handleEdit(item)}
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
            visibleItemCount={outsourceVendors.length}
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

export default OutsourceVendorsList;
