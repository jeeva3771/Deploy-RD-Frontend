import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllItems } from "../../../reducer/inventory/itemReducer";
import { fetchAllCategories } from "../../../reducer/inventory/common/materialCategoryReducer";
import { fetchAllTypes } from "../../../reducer/inventory/common/materialTypeReducer";
import { fetchAllStockSizes } from "../../../reducer/inventory/common/stockSizeReducer";
import { createMaterialPurchaseRequest, updateMaterialPurchaseRequest } from "../../../reducer/materialPurchaseRequestReducer";
import { toast } from "react-toastify";
import { Autocomplete, TextField } from "@mui/material";

const MaterialPurchaseRequestModal = ({ isOpen, onClose, requestToEdit }) => {
    const dispatch = useDispatch();
    const { items: allItems, loading: itemsLoading } = useSelector((state) => state.items);
    const { categories } = useSelector((state) => state.materialCategories);
    const { types: materialTypes } = useSelector((state) => state.materialTypes);
    const { stockSizes } = useSelector((state) => state.stockSize);
    const [requestItems, setRequestItems] = useState([{ category_id: "", type_id: "", item_id: "", item_name: "", required_qty: "", unit: "", purpose: "", is_new_item: false, specification: "", custom_item_type: "Direct", length: "", width: "", height: "", thickness: "" }]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            dispatch(fetchAllItems());
            dispatch(fetchAllCategories());
            dispatch(fetchAllTypes());
            dispatch(fetchAllStockSizes());

            if (requestToEdit && requestToEdit.items) {
                // Initialize form with the existing request items
                const mappedEditItems = requestToEdit.items.map(item => ({
                    ...item,
                    category_id: item.category_id?._id || item.category_id || "",
                    type_id: item.type_id?._id || item.type_id || "",
                    item_id: item.item_id?._id || item.item_id || "",
                    unit: item.unit || "",
                    purpose: item.purpose || "",
                    is_new_item: item.is_new_item || false,
                    specification: item.specification || "",
                    custom_item_type: item.custom_item_type || "Direct",
                    length: item.length || "",
                    width: item.width || "",
                    height: item.height || "",
                    thickness: item.thickness || ""
                }));
                setRequestItems(mappedEditItems);
            } else {
                setRequestItems([{ category_id: "", type_id: "", item_id: "", item_name: "", required_qty: "", unit: "", purpose: "", is_new_item: false, specification: "", custom_item_type: "Direct", length: "", width: "", height: "", thickness: "" }]);
            }
        }
    }, [isOpen, requestToEdit, dispatch]);

    const handleAddItem = () => {
        setRequestItems([...requestItems, { category_id: "", type_id: "", item_id: "", item_name: "", required_qty: "", unit: "", purpose: "", is_new_item: false, specification: "", custom_item_type: "Direct", length: "", width: "", height: "", thickness: "" }]);
    };

    const handleRemoveItem = (index) => {
        const list = [...requestItems];
        list.splice(index, 1);
        setRequestItems(list);
    };

    const handleInputChange = (index, field, value) => {
        const list = [...requestItems];
        if (field === "item_id") {
            const selectedItem = allItems.find(i => i._id === value);
            list[index].item_id = value;
            list[index].item_name = selectedItem?.name || "";
            if (selectedItem) {
                list[index].unit = "COUNT"; // Set unit to COUNT for existing items
                list[index].item_type = selectedItem.item_type || "";
                list[index].stock_sizes = selectedItem.stock_sizes || [];
                list[index].specification = ""; // Reset size when item changes

                // Auto-select type and category based on the selected item
                if (selectedItem.type_id) {
                    list[index].type_id = selectedItem.type_id?._id || selectedItem.type_id;
                }
                if (selectedItem.category_id || selectedItem.category) {
                    list[index].category_id = selectedItem.category_id?._id || selectedItem.category_id || selectedItem.category?._id || "";
                }
            } else {
                list[index].unit = "";
                list[index].item_type = "";
                list[index].stock_sizes = [];
                list[index].specification = "";
            }
        } else if (field === "type_id") {
            list[index].type_id = value;
            const selectedTypeObj = materialTypes?.find(t => t._id === value);
            if (selectedTypeObj?.name !== "Raw Material") {
                list[index].category_id = "";
            }
            list[index].item_id = "";
            list[index].item_name = "";
            list[index].unit = "";
            list[index].item_type = "";
            list[index].stock_sizes = [];
            list[index].specification = "";
            list[index].custom_item_type = "Direct";
            list[index].length = "";
            list[index].width = "";
            list[index].height = "";
            list[index].thickness = "";

            // Dispatch fetchAllItems with updated values immediately
            dispatch(fetchAllItems({ type_id: value, category: list[index].category_id }));
        } else if (field === "category_id") {
            list[index][field] = value;
            list[index].item_id = "";
            list[index].item_name = "";
            list[index].unit = "";
            list[index].item_type = "";
            list[index].stock_sizes = [];
            list[index].specification = "";
            list[index].custom_item_type = "Direct";
            list[index].length = "";
            list[index].width = "";
            list[index].height = "";
            list[index].thickness = "";

            // Dispatch fetchAllItems with updated values immediately
            dispatch(fetchAllItems({ type_id: list[index].type_id, category: value }));
        } else if (field === "is_new_item") {
            list[index].is_new_item = value;
            list[index].item_id = "";
            list[index].item_name = "";
            list[index].unit = "";
            list[index].specification = "";
            list[index].category_id = "";
            list[index].type_id = "";
            list[index].custom_item_type = "Direct";
            list[index].length = "";
            list[index].width = "";
            list[index].height = "";
            list[index].thickness = "";
        } else {
            list[index][field] = value;
        }
        setRequestItems(list);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        const isValid = requestItems.every(i => (i.is_new_item ? i.item_name : i.item_id) && i.required_qty > 0);
        if (!isValid) {
            toast.error("Please fill all item details and valid quantities.");
            return;
        }

        try {
            setSubmitting(true);
            const formattedItems = requestItems.map(item => {
                const payload = { ...item };
                if (payload.category_id === "") delete payload.category_id;
                if (payload.type_id === "") delete payload.type_id;
                if (payload.item_id === "") delete payload.item_id;

                if (payload.is_new_item) {
                    let sizeSpec = "";
                    if (item.custom_item_type === "sheet") {
                        const dims = [item.length, item.width, item.thickness].filter(Boolean).join("x");
                        sizeSpec = dims ? `Size: ${dims}` : "";
                    } else {
                        const dims = [item.length, item.width, item.height].filter(Boolean).join("x");
                        sizeSpec = dims ? `Size: ${dims}` : "";
                    }
                    const specParts = [item.specification, item.custom_item_type ? `Type: ${item.custom_item_type}` : "", sizeSpec].filter(Boolean);

                    payload.specification = specParts.join(" | ");
                }
                return payload;
            });

            if (requestToEdit) {
                await dispatch(updateMaterialPurchaseRequest({ requestId: requestToEdit._id || requestToEdit.id, items: formattedItems })).unwrap();
                toast.success("Purchase request updated successfully!");
            } else {
                await dispatch(createMaterialPurchaseRequest({ items: formattedItems })).unwrap();
                toast.success("Purchase request created!");
            }
            onClose();
            setRequestItems([{ category_id: "", type_id: "", item_id: "", item_name: "", required_qty: "", unit: "", purpose: "", is_new_item: false, specification: "", custom_item_type: "Direct", length: "", width: "", height: "", thickness: "" }]);
        } catch (err) {
            toast.error(err?.message || (requestToEdit ? "Failed to update request" : "Failed to create request"));
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b flex justify-between items-center bg-indigo-50">
                    <div>
                        <h2 className="text-xl font-bold text-indigo-900">{requestToEdit ? `Edit Request: ${requestToEdit.request_number || ''}` : 'New Material Purchase Request'}</h2>
                        <p className="text-sm text-indigo-600/70">{requestToEdit ? 'Update the required materials for this request.' : 'Request materials for upcoming jobs or stock replenishment.'}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition p-2 hover:bg-white rounded-full">
                        <i className="fas fa-times text-lg"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 scroll-smooth">
                    <div className="space-y-4">
                        {requestItems.map((item, index) => (
                            <div key={index} className="bg-gray-50 border border-gray-100 rounded-xl p-4 relative group">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                    {/* Line 1: Type */}
                                    <div className="md:col-span-12">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Material Type</label>
                                        <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden h-10">
                                            <button
                                                type="button"
                                                onClick={() => handleInputChange(index, "is_new_item", false)}
                                                className={`flex-1 text-[10px] font-bold uppercase transition ${!item.is_new_item ? "bg-indigo-600 text-white" : "hover:bg-gray-50 text-gray-400"}`}
                                            >
                                                Existing
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleInputChange(index, "is_new_item", true)}
                                                className={`flex-1 text-[10px] font-bold uppercase transition ${item.is_new_item ? "bg-indigo-600 text-white" : "hover:bg-gray-50 text-gray-400"}`}
                                            >
                                                New
                                            </button>
                                        </div>
                                    </div>

                                    {/* Shared: Material Type & Category */}
                                    <div className={materialTypes?.find(t => t._id === item.type_id)?.name === "Raw Material" ? "md:col-span-6" : "md:col-span-12"}>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Material Type</label>
                                        <select
                                            value={item.type_id}
                                            onChange={(e) => handleInputChange(index, "type_id", e.target.value)}
                                            className="w-full h-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none p-2 bg-white"
                                        >
                                            <option value="">All Types</option>
                                            {materialTypes?.map((type) => (
                                                <option key={type._id} value={type._id}>{type.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {materialTypes?.find(t => t._id === item.type_id)?.name === "Raw Material" && (
                                        <div className="md:col-span-6">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Material Category</label>
                                            <select
                                                value={item.category_id}
                                                onChange={(e) => handleInputChange(index, "category_id", e.target.value)}
                                                className="w-full h-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none p-2 bg-white"
                                            >
                                                <option value="">All Categories</option>
                                                {categories?.map((cat) => (
                                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Line 2: Select Item or New Item Details */}
                                    {!item.is_new_item ? (
                                        <>
                                            <div className={item.item_type === "sheet" ? "md:col-span-8" : "md:col-span-12"}>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Search & Select Item</label>
                                                <Autocomplete
                                                    options={allItems.filter(i => (!item.category_id || i.category === item.category_id || i.category?._id === item.category_id) && (!item.type_id || i.type_id === item.type_id || i.type_id?._id === item.type_id))}
                                                    getOptionLabel={(option) => option ? (option.item_code ? `${option.name} (${option.item_code})` : option.name || "") : ""}
                                                    value={allItems.find(i => i._id === item.item_id) || (item.item_id ? { _id: item.item_id, name: item.item_name || "", item_code: "" } : null)}
                                                    isOptionEqualToValue={(option, val) => option?._id === val?._id}
                                                    onChange={(event, newValue) => {
                                                        handleInputChange(index, "item_id", newValue?._id || "");
                                                    }}
                                                    loading={itemsLoading}
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            placeholder={itemsLoading ? "Loading items..." : "Type to search material..."}
                                                            size="small"
                                                            className="bg-white rounded-lg"
                                                            sx={{
                                                                "& .MuiOutlinedInput-root": {
                                                                    height: "40px",
                                                                    fontSize: "0.875rem",
                                                                    borderRadius: "0.5rem",
                                                                    "& fieldset": { borderColor: "#E5E7EB" },
                                                                    "&:hover fieldset": { borderColor: "#D1D5DB" },
                                                                    "&.Mui-focused fieldset": { borderColor: "#4F46E5", borderWidth: "2px" },
                                                                }
                                                            }}
                                                        />
                                                    )}
                                                />
                                            </div>
                                            {item.item_type === "sheet" && (
                                                <div className="md:col-span-4">
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Size</label>
                                                    <select
                                                        value={item.specification}
                                                        onChange={(e) => handleInputChange(index, "specification", e.target.value)}
                                                        className="w-full h-10 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none p-2 bg-white"
                                                        required
                                                    >
                                                        <option value="">Select Size</option>
                                                        {(stockSizes || []).map((size, sIdx) => (
                                                            <option key={size._id || sIdx} value={size.size}>{size.size}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <div className="md:col-span-4">
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Material Name</label>
                                                <input
                                                    type="text"
                                                    value={item.item_name}
                                                    onChange={(e) => handleInputChange(index, "item_name", e.target.value)}
                                                    className="w-full h-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none p-2 bg-white"
                                                    placeholder="Enter name"
                                                    required
                                                />
                                            </div>
                                            <div className="md:col-span-4">
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Item Size Type</label>
                                                <select
                                                    value={item.custom_item_type || "Direct"}
                                                    onChange={(e) => handleInputChange(index, "custom_item_type", e.target.value)}
                                                    className="w-full h-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none p-2 bg-white"
                                                >
                                                    <option value="Direct">Direct</option>
                                                    <option value="sheet">Sheet</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-4">
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Unit</label>
                                                <input
                                                    type="text"
                                                    value={item.unit}
                                                    onChange={(e) => handleInputChange(index, "unit", e.target.value)}
                                                    className="w-full h-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none p-2 bg-white"
                                                    placeholder="e.g. Pcs, Kg"
                                                    required
                                                />
                                            </div>

                                            {(!item.custom_item_type || item.custom_item_type === "Direct") && (
                                                <>
                                                    {["length", "width", "height"].map((dim) => (
                                                        <div className="md:col-span-4" key={dim}>
                                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{dim}</label>
                                                            <input
                                                                type="text"
                                                                value={item[dim] || ""}
                                                                onChange={(e) => handleInputChange(index, dim, e.target.value)}
                                                                className="w-full h-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none p-2 bg-white"
                                                                placeholder={`Enter ${dim}`}
                                                            />
                                                        </div>
                                                    ))}
                                                </>
                                            )}

                                            {item.custom_item_type === "sheet" && (
                                                <>
                                                    {["length", "width", "thickness"].map((dim) => (
                                                        <div className="md:col-span-4" key={dim}>
                                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{dim}</label>
                                                            <input
                                                                type="text"
                                                                value={item[dim] || ""}
                                                                onChange={(e) => handleInputChange(index, dim, e.target.value)}
                                                                className="w-full h-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none p-2 bg-white"
                                                                placeholder={`Enter ${dim}`}
                                                            />
                                                        </div>
                                                    ))}
                                                </>
                                            )}

                                            <div className="md:col-span-12">
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Specification / Details</label>
                                                <input
                                                    type="text"
                                                    value={item.specification}
                                                    onChange={(e) => handleInputChange(index, "specification", e.target.value)}
                                                    className="w-full h-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none p-2 bg-white"
                                                    placeholder="Any other specifications"
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div className="md:col-span-3">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quantity</label>
                                        <div className="flex">
                                            <input
                                                type="number"
                                                value={item.required_qty}
                                                onChange={(e) => handleInputChange(index, "required_qty", e.target.value)}
                                                className="w-full h-10 border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none p-2 bg-white rounded-lg"
                                                placeholder="Qty"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="md:col-span-6">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Purpose/Remarks</label>
                                        <input
                                            type="text"
                                            value={item.purpose}
                                            onChange={(e) => handleInputChange(index, "purpose", e.target.value)}
                                            className="w-full h-10 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none p-2 bg-white"
                                            placeholder="Job # or reason"
                                        />
                                    </div>
                                </div>
                                {requestItems.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(index)}
                                        className="absolute -top-2 -right-2 bg-red-100 text-red-500 hover:bg-red-500 hover:text-white w-6 h-6 rounded-full flex items-center justify-center transition shadow-sm"
                                    >
                                        <i className="fas fa-minus text-[10px]"></i>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={handleAddItem}
                        className="mt-6 flex items-center space-x-2 text-indigo-600 font-bold text-sm hover:translate-x-1 transition-transform"
                    >
                        <i className="fas fa-plus-circle"></i>
                        <span>Add Another Item</span>
                    </button>
                </form>

                <div className="p-6 border-t bg-gray-50 flex justify-end items-center space-x-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 text-gray-500 font-bold hover:text-gray-700 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2 rounded-xl font-bold shadow-lg shadow-indigo-200 transition transform active:scale-95 disabled:opacity-50"
                    >
                        {submitting ? (requestToEdit ? "Updating..." : "Submitting...") : (requestToEdit ? "Update Request" : "Submit Request")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MaterialPurchaseRequestModal;
