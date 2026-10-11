import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useLoader } from "../../../context/LoaderContext";
import {
    fetchAllStockSizes,
    createStockSize,
    updateStockSize,
    deleteStockSize,
    setFilters,
    setPagination,
    setSortConfig,
    resetFilters,
    resetPagination,
    resetSortConfig,
} from "../../../reducer/inventory/common/stockSizeReducer";
import ActionButtons from "../../components/ActionButtons";
import SortableHeader from "../../components/SortableHeader";
import Pagination from "../../components/Pagination";
import DeleteModal from "../../components/DeleteModal";
import StockSizeForm from "./StockSizeForm";
import { capitalizeFirst } from "../../../utils/helper/capitalize";

const StockSizeList = () => {
    const dispatch = useDispatch();
    const { showLoader, hideLoader } = useLoader();

    // Redux State
    const { stockSizes, pagination, filters, sortConfig } = useSelector(
        (state) => state.stockSize || state.stockSizes // Fallback if state name varies
    );

    // Local State
    const [formData, setFormData] = useState({
        size: "",
        width: "",
        height: "",
        unit: "inch",
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
                sortField: sortConfig.key,
            };
            await dispatch(fetchAllStockSizes(params));
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch stock sizes");
        } finally {
            hideLoader();
        }
    }, [
        dispatch,
        pagination.page,
        pagination.limit,
        filters.search,
        sortConfig.direction,
        sortConfig.key,
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
        setFormData((prev) => {
            const updated = { ...prev, [name]: value };

            if (name === "width" || name === "height") {
                const width = name === "width" ? value : prev.width;
                const height = name === "height" ? value : prev.height;

                if (width && height) {
                    updated.size = `${width}x${height}`;
                } else {
                    updated.size = "";
                }
            }
            return updated;
        });
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
        if (!formData.size.trim()) newErrors.size = "Size name is required";
        if (!formData.width) newErrors.width = "Width is required";
        if (!formData.height) newErrors.height = "Height is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleReset = () => {
        setFormData({
            size: "",
            width: "",
            height: "",
            unit: "inch",
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
                result = await dispatch(updateStockSize({ id: currentId, formData }));
            } else {
                result = await dispatch(createStockSize(formData));
            }

            if (createStockSize.fulfilled.match(result) || updateStockSize.fulfilled.match(result)) {
                toast.success(
                    currentId
                        ? "Stock size updated successfully"
                        : "Stock size created successfully"
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
            size: item.size,
            width: item.width,
            height: item.height,
            unit: item.unit || "inch",
            is_active: item.is_active,
        });
        setCurrentId(item.id);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };



    const confirmDelete = async () => {
        try {
            showLoader();
            const result = await dispatch(deleteStockSize(deleteModalData.id));
            if (deleteStockSize.fulfilled.match(result)) {
                toast.success("Stock size deleted successfully");
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
                            placeholder="Search by size..."
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
                <StockSizeForm
                    formData={formData}
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
                                        label="Size"
                                        sortKey="size"
                                        sortConfig={sortConfig}
                                        onSort={handleSort}
                                    />
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Unit
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
                                {stockSizes.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="5"
                                            className="px-6 py-4 text-center text-sm text-gray-500"
                                        >
                                            No stock sizes found
                                        </td>
                                    </tr>
                                ) : (
                                    stockSizes.map((item, idx) => (
                                        <tr
                                            key={item.id || idx}
                                            className={`hover:bg-gray-50 ${idx % 2 === 1 ? "bg-gray-50" : ""
                                                }`}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {capitalizeFirst(item.size)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {item.unit}
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
                        visibleItemCount={stockSizes.length}
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

export default StockSizeList;
