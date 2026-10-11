import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useLoader } from "../../../context/LoaderContext";
import {
    fetchAllShiftTimes,
    createShiftTime,
    updateShiftTime,
    deleteShiftTime,
    setFilters,
    setPagination,
    setSortConfig,
    resetFilters,
    resetPagination,
    resetSortConfig,
} from "../../../reducer/masters/shiftTimeReducer"; // Adjust path if needed (reducer is in reducer/masters/shiftTimeReducer.js)
import ActionButtons from "../../components/ActionButtons";
import SortableHeader from "../../components/SortableHeader";
import Pagination from "../../components/Pagination";
import DeleteModal from "../../components/DeleteModal";
import ShiftTimeForm from "./ShiftTimeForm";
import { capitalizeFirst } from "../../../utils/helper/capitalize";

const ShiftTimeList = () => {
    const dispatch = useDispatch();
    const { showLoader, hideLoader } = useLoader();

    // Redux State
    const { shiftTimes, pagination, filters, sortConfig } = useSelector(
        (state) => state.shiftTime // Ensure this matches store key
    );

    // Local State
    const [formData, setFormData] = useState({
        name: "",
        start_time: "",
        end_time: "",
        is_active: true,
    });
    const [currentId, setCurrentId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [deleteModalData, setDeleteModalData] = useState(null);

    // Initial Fetch
    const fetchList = useCallback(async () => {
        try {
            showLoader();
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                search: filters.search,
                order: sortConfig.direction,
                // sortField: sortConfig.key, // Controller handles sort if needed
            };
            await dispatch(fetchAllShiftTimes(params));
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch shift times");
        } finally {
            hideLoader();
        }
    }, [
        dispatch,
        pagination.page,
        pagination.limit,
        filters.search,
        sortConfig.direction,
        showLoader,
        hideLoader,
    ]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    // Reset on unmount
    useEffect(() => {
        return () => {
            dispatch(resetFilters());
            dispatch(resetPagination());
            dispatch(resetSortConfig());
        };
    }, [dispatch]);

    // Handlers
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const handleSearchChange = (value) => {
        dispatch(setFilters({ search: value }));
        dispatch(setPagination({ page: 1 }));
    };

    const handleSort = (key) => {
        const direction =
            sortConfig.key === key && sortConfig.direction === "asc"
                ? "desc"
                : "asc";
        dispatch(setSortConfig({ key, direction }));
    };

    const handlePageChange = (page) => {
        dispatch(setPagination({ page }));
    };

    const handleItemsPerPageChange = (limit) => {
        dispatch(setPagination({ limit, page: 1 }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = "Shift name is required";
        if (!formData.start_time.trim()) newErrors.start_time = "Start time is required";
        if (!formData.end_time.trim()) newErrors.end_time = "End time is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleReset = () => {
        setFormData({
            name: "",
            start_time: "",
            end_time: "",
            is_active: true,
        });
        setCurrentId(null);
        setErrors({});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        showLoader();
        try {
            let result;
            if (currentId) {
                result = await dispatch(updateShiftTime({ id: currentId, formData }));
            } else {
                result = await dispatch(createShiftTime(formData));
            }

            if (createShiftTime.fulfilled.match(result) || updateShiftTime.fulfilled.match(result)) {
                toast.success(
                    currentId
                        ? "Shift time updated successfully"
                        : "Shift time created successfully"
                );
                handleReset();
                fetchList();
            } else {
                toast.error(result.payload?.message || "Operation failed");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsSubmitting(false);
            hideLoader();
        }
    };

    const handleEdit = (item) => {
        setFormData({
            name: item.name,
            start_time: item.start_time,
            end_time: item.end_time,
            is_active: item.is_active,
        });
        setCurrentId(item.id);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };



    const confirmDelete = async () => {
        try {
            showLoader();
            const result = await dispatch(deleteShiftTime(deleteModalData.id));
            if (deleteShiftTime.fulfilled.match(result)) {
                toast.success("Shift time deleted successfully");
                fetchList();
            } else {
                toast.error(result.payload?.message || "Delete failed");
            }
        } catch (error) {
            toast.error("Delete failed");
        } finally {
            setDeleteModalData(null);
            hideLoader();
        }
    };

    const startIndex = (pagination.page - 1) * pagination.limit;

    return (
        <div className="bg-gray-50 mt-[5vh]">
            <div className="container mx-auto px-4 py-6">
                {/* Header & Search */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div className="relative w-full md:w-64">
                        <input
                            type="text"
                            placeholder="Search shift times..."
                            value={filters.search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                            🔍
                        </span>
                    </div>
                </div>

                {/* Form Component */}
                <ShiftTimeForm
                    formData={formData}
                    setFormData={setFormData}
                    errors={errors}
                    isSubmitting={isSubmitting}
                    onInputChange={handleInputChange}
                    onSubmit={handleSubmit}
                    currentId={currentId}
                    handleReset={handleReset}
                />

                {/* Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <SortableHeader
                                        label="Name"
                                        sortKey="name"
                                        sortConfig={sortConfig}
                                        onSort={handleSort}
                                    />
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Start Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        End Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {shiftTimes.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="5"
                                            className="px-6 py-4 text-center text-sm text-gray-500"
                                        >
                                            No shift times found
                                        </td>
                                    </tr>
                                ) : (
                                    shiftTimes.map((item, idx) => (
                                        <tr
                                            key={item.id || idx}
                                            className={`hover:bg-gray-50 ${idx % 2 === 1 ? "bg-gray-50" : ""
                                                }`}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {capitalizeFirst(item.name)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {item.start_time}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {item.end_time}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.is_active
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-red-100 text-red-800"
                                                        }`}
                                                >
                                                    {item.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <ActionButtons
                                                    item={item}
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
                        visibleItemCount={shiftTimes.length}
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

export default ShiftTimeList;
