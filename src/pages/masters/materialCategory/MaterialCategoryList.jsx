import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useLoader } from "../../../context/LoaderContext";
import {
    fetchAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    setFilters,
    setPagination,
    setSortConfig,
    resetFilters,
    resetPagination,
    resetSortConfig,
} from "../../../reducer/inventory/common/materialCategoryReducer";
import ActionButtons from "../../components/ActionButtons";
import SortableHeader from "../../components/SortableHeader";
import Pagination from "../../components/Pagination";
import DeleteModal from "../../components/DeleteModal";
import MaterialCategoryForm from "./MaterialCategoryForm";
import { capitalizeFirst } from "../../../utils/helper/capitalize";

const MaterialCategoryList = () => {
    const dispatch = useDispatch();
    const { showLoader, hideLoader } = useLoader();

    // Redux State
    const { categories, pagination, filters, sortConfig } = useSelector(
        (state) => state.materialCategories
    );

    // Local State
    const [formData, setFormData] = useState({
        name: "",
        description: "",
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
                order: sortConfig.direction, // Backend expects 'order', verified in controller
                sortField: sortConfig.key, // Controller handles sortField too if needed
            };
            await dispatch(fetchAllCategories(params));
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch material categories");
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
        if (!formData.name.trim()) newErrors.name = "Category name is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleReset = () => {
        setFormData({
            name: "",
            description: "",
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
                result = await dispatch(updateCategory({ id: currentId, formData }));
            } else {
                result = await dispatch(createCategory(formData));
            }

            if (createCategory.fulfilled.match(result) || updateCategory.fulfilled.match(result)) {
                toast.success(
                    currentId
                        ? "Material category updated successfully"
                        : "Material category created successfully"
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
            description: item.description || "",
            is_active: item.is_active,
        });
        setCurrentId(item.id); // Use 'id' (custom ID) or '_id' (Mongo ID) depending on what backend expects for updates. 
        // Controller uses 'id' in params: const { id } = req.params; const category = await materialCategoryModel.findOne({ id });
        // So we should use item.id which is the nanoid.
        window.scrollTo({ top: 0, behavior: "smooth" });
    };



    const confirmDelete = async () => {
        try {
            showLoader();
            const result = await dispatch(deleteCategory(deleteModalData.id)); // Controller uses 'id'
            if (deleteCategory.fulfilled.match(result)) {
                toast.success("Material category deleted successfully");
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
                            placeholder="Search categories..."
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
                <MaterialCategoryForm
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
                                        Description
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
                                {categories.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="4"
                                            className="px-6 py-4 text-center text-sm text-gray-500"
                                        >
                                            No categories found
                                        </td>
                                    </tr>
                                ) : (
                                    categories.map((item, idx) => (
                                        <tr
                                            key={item.id || idx}
                                            className={`hover:bg-gray-50 ${idx % 2 === 1 ? "bg-gray-50" : ""
                                                }`}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {capitalizeFirst(item.name)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                {item.description || "-"}
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
                        visibleItemCount={categories.length}
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

export default MaterialCategoryList;
