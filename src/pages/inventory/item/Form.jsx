import React, { useEffect, useState } from "react";
import {
  MenuItem,
  Select,
  FormControl,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  createItem,
  updateItem,
} from "../../../reducer/inventory/itemReducer";
import {
  createCustomItem,
  updateCustomItem,
} from "../../../reducer/inventory/customItemReducer";
import { fetchAllStockSizes } from "../../../reducer/inventory/common/stockSizeReducer";
import { fetchAllRateUnits } from "../../../reducer/inventory/common/rateUnitReducer";
import { capitalizeFirst } from "../../../utils/helper/capitalize";
import { useLoader } from "../../../context/LoaderContext";

const ItemForm = ({ editingItem, onClose, onSuccess, initialIsInventoryItem = true }) => {
  const { showLoader, hideLoader } = useLoader();
  const dispatch = useDispatch();

  const { stockSizes } = useSelector((state) => state.stockSize);
  const { categories } = useSelector((state) => state.materialCategories);
  const { types } = useSelector((state) => state.materialTypes);
  const { rateUnits } = useSelector((state) => state.rateUnit);
  const { vendors } = useSelector((state) => state.vendor);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRawMaterialSelected, setIsRawMaterialSelected] = useState(false);

  const [formData, setFormData] = useState({
    id: "",
    item_code: "",
    name: "",
    type_id: "",
    category_id: "",
    item_type: "",
    unit: "",
    stock_sizes: [],
    size_wise_stock: [],
    price: "",
    cost: "",
    stock: "",
    min_stock: "",
    max_stock: "",
    supplier_ids: [],
    logical_rate: [],
    is_inventory_item: initialIsInventoryItem,
    job_no: "",
    sub_job_no: "",
    reference_no: "",
  });

  const [fieldErrors, setFieldErrors] = useState({
    name: "",
    type_id: "",
    category_id: "",
    item_type: "",
    unit: "",
    stock_sizes: "",
    price: "",
    cost: "",
  });

  useEffect(() => {
    dispatch(fetchAllStockSizes());
    dispatch(fetchAllRateUnits());
  }, [dispatch]);

  /* =========================
     EDIT MODE POPULATE
  ========================== */
  useEffect(() => {
    if (editingItem) {
      setFormData({
        id: editingItem.id || "",
        item_code: editingItem.item_code || "",
        name: editingItem.name || "",
        type_id: editingItem.type_id?._id || "",
        category_id: editingItem.category ? editingItem.category?._id : "",
        item_type: editingItem.item_type || "",
        unit: editingItem.unit?._id || "",
        stock_sizes: (editingItem.stock_sizes || []).map((s) =>
          typeof s === "object" ? s._id : s
        ),
        size_wise_stock: (editingItem.size_wise_stock || []).map(s => ({
          ...s,
          size_id: String(s.size_id?._id || s.size_id)
        })),
        price: editingItem.price || "",
        cost: editingItem.cost || "",
        stock: editingItem.stock || "",
        min_stock: editingItem.min_stock || "",
        max_stock: editingItem.max_stock || "",
        supplier_ids: (editingItem.supplier_ids || []).map((v) =>
          typeof v === "object" ? v._id : v
        ),
        logical_rate: editingItem.logical_rate ? JSON.parse(JSON.stringify(editingItem.logical_rate)) : [],
        is_inventory_item: editingItem.is_inventory_item ?? true,
        job_no: editingItem.job_no || "",
        sub_job_no: editingItem.sub_job_no || "",
        reference_no: editingItem.reference_no || "",
      });

      setIsRawMaterialSelected(editingItem.type_id?.name === "Raw Material");
    }
  }, [editingItem]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };

    // Clear stock_sizes when item_type changes away from "sheet"
    if (name === "item_type" && value !== "sheet") {
      newFormData.stock_sizes = [];
      newFormData.size_wise_stock = [];
    }

    if (name === "type_id") {
      const selectedType = types.find(
        (t) => String(t._id) === String(value)
      )
      console.log(selectedType)
      setIsRawMaterialSelected(selectedType.name === "Raw Material");
    }

    if (name === "category_id" && !isRawMaterialSelected) {
      newFormData.category_id = ""
    }

    setFormData(newFormData);

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    // Clear stock_sizes error when item_type changes away from "sheet"
    if (name === "item_type" && value !== "sheet" && fieldErrors.stock_sizes) {
      setFieldErrors((prev) => ({ ...prev, stock_sizes: "" }));
    }
  };

  const sanitizeDecimal = (value) => {
    if (!value) return "";

    // Remove all except digits and dot
    let v = value.replace(/[^0-9.]/g, "");

    // Only one dot allowed
    v = v.replace(/(\..*)\./g, "$1");

    // Limit to 2 decimals
    if (v.includes(".")) {
      const [i, d] = v.split(".");
      v = i + "." + d.slice(0, 2);
    }

    return v;
  };

  const validateForm = () => {
    const newErrors = {
      name: "",
      type_id: "",
      category_id: "",
      item_type: "",
      unit: "",
      stock_sizes: "",
      price: "",
      cost: "",
    };

    let hasError = false;

    if (!formData.name.trim()) {
      newErrors.name = "Material name is required";
      hasError = true;
    }

    if (!formData.type_id) {
      newErrors.type_id = "Type is required";
      hasError = true;
    }

    if (!formData.category_id && isRawMaterialSelected) {
      newErrors.category_id = "Category is required";
      hasError = true;
    }

    if (!formData.item_type) {
      newErrors.item_type = "Item type is required";
      hasError = true;
    }

    // If item_type is "sheet", stock_sizes is mandatory
    if (formData.item_type === "sheet" && (!formData.stock_sizes || formData.stock_sizes.length === 0)) {
      newErrors.stock_sizes = "At least one stock size is required for sheet type";
      hasError = true;
    }

    if (!formData.unit) {
      newErrors.unit = "Unit is required";
      hasError = true;
    }

    if (!formData.price) {
      newErrors.price = "Price is required";
      hasError = true;
    } else if (formData.price < 0) {
      newErrors.price = "Price must be a positive number";
      hasError = true;
    }

    if (!formData.cost) {
      newErrors.cost = "Cost is required";
      hasError = true;
    } else if (formData.cost < 0) {
      newErrors.cost = "Cost must be a positive number";
      hasError = true;
    }

    setFieldErrors(newErrors);
    return !hasError;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the highlighted errors");
      return;
    }

    setIsSubmitting(true);
    showLoader();

    const payload = {
      id: formData.id,
      item_code: formData.item_code,
      name: formData.name.trim(),
      type_id: formData.type_id,
      item_type: formData.item_type,
      unit: formData.unit,
      stock_sizes:
        formData.item_type === "sheet" ? formData.stock_sizes : [],
      size_wise_stock:
        formData.item_type === "sheet" ? formData.size_wise_stock : [],
      price: formData.price,
      cost: formData.cost,
      stock: Number(formData.stock || 0),
      min_stock: Number(formData.min_stock || 0),
      max_stock: Number(formData.max_stock || 0),
      supplier_ids: formData.supplier_ids,
      logical_rate: formData.logical_rate,
      is_inventory_item: formData.is_inventory_item,
      job_no: formData.job_no,
      sub_job_no: formData.sub_job_no,
      reference_no: formData.reference_no,
    };
    if (formData.category_id) {
      payload.category_id = formData.category_id;
    }

    console.log("Submitting Item Payload:", payload);

    try {
      if (editingItem) {
        if (formData.is_inventory_item === false) {
          await dispatch(updateCustomItem({ id: editingItem.id, formData: { ...payload, _id: editingItem._id } })).unwrap();
        } else {
          await dispatch(updateItem({ id: editingItem.id, formData: { ...payload, _id: editingItem._id } })).unwrap();
        }
        toast.success("Item updated successfully");
      } else {
        if (formData.is_inventory_item === false) {
          await dispatch(createCustomItem(payload)).unwrap();
        } else {
          await dispatch(createItem(payload)).unwrap();
        }
        toast.success("Item created successfully");
      }

      onSuccess();
    } catch (err) {
      console.error("Item operation error:", err);
      const msg = err?.message || "Something went wrong";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
      hideLoader();
    }
  };

  const resetForm = () => {
    setFormData({
      id: "",
      item_code: "",
      name: "",
      type_id: "",
      category_id: "",
      item_type: "",
      unit: "",
      stock_sizes: [],
      size_wise_stock: [],
      price: "",
      cost: "",
      stock: "",
      min_stock: "",
      max_stock: "",
      supplier_ids: [],
      logical_rate: [],
      is_inventory_item: initialIsInventoryItem,
    });
    setFieldErrors({
      name: "",
      type_id: "",
      category_id: "",
      item_type: "",
      unit: "",
      stock_sizes: "",
      price: "",
      cost: "",
    });
  };

  /* =========================
     LOGIC RATE HELPERS
  ========================== */
  const addLogicRule = () => {
    let defaultField = "logic1"; // Default for generic items

    // Enforce frozen fields for specific items
    if (formData.name === "Black Box (Custom)") {
      defaultField = "logic3";
    } else if (formData.name === "Thermocol (Custom)") {
      defaultField = "jobQty";
    }

    setFormData({
      ...formData,
      logical_rate: [
        ...(formData.logical_rate || []),
        {
          condition: { field: defaultField, operator: ">=", value: "" },
          rate: "",
        },
      ],
    });
  };

  const removeLogicRule = (index) => {
    const updatedRates = [...(formData.logical_rate || [])];
    updatedRates.splice(index, 1);
    setFormData({ ...formData, logical_rate: updatedRates });
  };

  const updateLogicRule = (index, part, field, value) => {
    const updatedRates = [...(formData.logical_rate || [])];
    updatedRates[index] = { ...updatedRates[index] };
    if (part === "condition") {
      updatedRates[index].condition = { ...updatedRates[index].condition, [field]: value };
    } else {
      updatedRates[index][field] = value;
    }
    setFormData({ ...formData, logical_rate: updatedRates });
  };

  const handleSizeStockChange = (sizeId, newCount, stockSize) => {
    let count = newCount === "" ? "" : Number(newCount);
    let sqinch = 0;
    
    if (count !== "" && stockSize) {
       if (stockSize.width && stockSize.height) {
          sqinch = stockSize.width * stockSize.height * count;
       } else {
          const parts = stockSize.size.toLowerCase().split("x");
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
             sqinch = Number(parts[0]) * Number(parts[1]) * count;
          }
       }
    }

    setFormData((prev) => {
      const newSizeWiseStock = [...(prev.size_wise_stock || [])];
      const index = newSizeWiseStock.findIndex(s => s.size_id === sizeId);
      if (index >= 0) {
         newSizeWiseStock[index] = { ...newSizeWiseStock[index], count, sqinch };
      } else {
         newSizeWiseStock.push({ size_id: sizeId, count, sqinch });
      }

      const totalStock = newSizeWiseStock.reduce((acc, curr) => acc + (Number(curr.sqinch) || 0), 0);

      return {
        ...prev,
        size_wise_stock: newSizeWiseStock,
        stock: totalStock
      };
    });
  };

  /* =========================
     UI
  ========================== */
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
        <div className="sticky top-0 bg-white z-50 border-b border-gray-100 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-blue-600">
            {editingItem ? "Edit Item" : "Create Item"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Item Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter item/product name"
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition ${fieldErrors.name
                ? "border-red-500 focus:ring-red-300 focus:border-red-500"
                : "border-gray-300 focus:ring-blue-300 focus:border-blue-500"
                }`}
            />
            {fieldErrors.name && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
            )}
          </div>

          {/* Type and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <FormControl fullWidth variant="outlined" size="small">
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  htmlFor="type"
                >
                  Type of Material <span className="text-red-500">*</span>
                </label>
                <Select
                  id="type"
                  value={formData.type_id}
                  onChange={handleChange}
                  name="type_id"
                  displayEmpty
                  size="small"
                  error={!!fieldErrors.type_id}
                >
                  <MenuItem value="">
                    <span className="text-gray-400">Select type</span>
                  </MenuItem>
                  {types.map((t) => (
                    <MenuItem key={t._id} value={t._id}>
                      {capitalizeFirst(t.name)}
                    </MenuItem>
                  ))}
                </Select>
                {fieldErrors.type_id && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.type_id}
                  </p>
                )}
              </FormControl>
            </div>
            {isRawMaterialSelected &&
              <div>
                <FormControl fullWidth variant="outlined" size="small">
                  <label
                    className="block text-sm font-medium text-gray-700 mb-2"
                    htmlFor="category"
                  >
                    Category
                    <span className="text-red-500">{" "}*</span>
                  </label>
                  <Select
                    id="category"
                    value={formData.category_id}
                    onChange={handleChange}
                    name="category_id"
                    displayEmpty
                    size="small"
                    error={!!fieldErrors.category_id}
                  >
                    <MenuItem value="">
                      <span className="text-gray-400">Select category</span>
                    </MenuItem>
                    {categories.map((c) => (
                      <MenuItem key={c._id} value={c._id}>
                        {capitalizeFirst(c.name)}
                      </MenuItem>
                    ))}
                  </Select>
                  {isRawMaterialSelected && fieldErrors.category_id && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.category_id}
                    </p>
                  )}
                </FormControl>
              </div>
            }
          </div>

          {/* Item Type and Rate Unit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <FormControl fullWidth variant="outlined" size="small">
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  htmlFor="item_type"
                >
                  Item Type <span className="text-red-500">*</span>
                </label>
                <Select
                  id="item_type"
                  name="item_type"
                  value={formData.item_type}
                  onChange={handleChange}
                  displayEmpty
                  size="small"
                  error={!!fieldErrors.item_type}
                >
                  <MenuItem value="">
                    <span className="text-gray-400">Select item type</span>
                  </MenuItem>
                  <MenuItem value="sheet">Sheet</MenuItem>
                  <MenuItem value="direct">Direct</MenuItem>
                  <MenuItem value="unit">Unit</MenuItem>
                  <MenuItem value="capacity">Capacity</MenuItem>
                  <MenuItem value="logic">Logic</MenuItem>
                </Select>
                {fieldErrors.item_type && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.item_type}
                  </p>
                )}
              </FormControl>
            </div>


            <div>
              <FormControl fullWidth variant="outlined" size="small">
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  htmlFor="unit"
                >
                  Rate Unit <span className="text-red-500">*</span>
                </label>
                <Select
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  displayEmpty
                  size="small"
                  error={!!fieldErrors.unit}
                >
                  <MenuItem value="">
                    <span className="text-gray-400">Select rate unit</span>
                  </MenuItem>
                  {rateUnits.map((u) => (
                    <MenuItem key={u._id} value={u._id}>
                      {u.name} ({u.symbol})
                    </MenuItem>
                  ))}
                </Select>
                {fieldErrors.unit && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.unit}
                  </p>
                )}
              </FormControl>
            </div>
          </div>

          {/* Stock Sizes (only for sheet type) */}
          {formData.item_type === "sheet" && (
            <div className="mb-4">
              <FormControl fullWidth variant="outlined" size="small">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Sizes <span className="text-red-500">*</span>
                </label>
                <Select
                  value=""
                  displayEmpty
                  size="small"
                  error={!!fieldErrors.stock_sizes}
                  onChange={(e) => {
                    const selectedId = e.target.value;

                    if (
                      selectedId &&
                      !(formData.stock_sizes || []).includes(selectedId)
                    ) {
                      setFormData(prev => ({
                        ...prev,
                        stock_sizes: [...(prev.stock_sizes || []), selectedId],
                        // also add size_wise_stock entry
                        size_wise_stock: [...(prev.size_wise_stock || []), { size_id: selectedId, count: "", sqinch: 0 }]
                      }));
                      if (fieldErrors.stock_sizes) {
                        setFieldErrors((prev) => ({ ...prev, stock_sizes: "" }));
                      }
                    }
                    e.target.value = "";
                  }}
                >
                  <MenuItem value="">
                    <span className="text-gray-400">Select stock sizes</span>
                  </MenuItem>
                  {stockSizes
                    .filter(
                      (size) =>
                        !(formData.stock_sizes || []).includes(size._id)
                    )
                    .map((s) => (
                      <MenuItem key={s._id} value={s._id}>
                        {s.size}
                      </MenuItem>
                    ))}
                </Select>
                {fieldErrors.stock_sizes && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.stock_sizes}
                  </p>
                )}
              </FormControl>

              {/* Selected Stock Sizes Display */}
              {formData.stock_sizes && formData.stock_sizes.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.stock_sizes.map((sizeId) => {
                    const stockSize = stockSizes.find(
                      (s) => String(s._id) === String(sizeId)
                    );
                    return (
                      <span
                        key={sizeId}
                        className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 border border-blue-200"
                      >
                        {stockSize ? stockSize.size : "Unknown"}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => {
                              const newStockSizes = prev.stock_sizes.filter((id) => id !== sizeId);
                              const newSizeWiseStock = prev.size_wise_stock ? prev.size_wise_stock.filter((s) => s.size_id !== sizeId) : [];
                              const totalStock = newSizeWiseStock.reduce((acc, curr) => acc + (Number(curr.sqinch) || 0), 0);
                              return {
                                ...prev,
                                stock_sizes: newStockSizes,
                                size_wise_stock: newSizeWiseStock,
                                stock: totalStock,
                              };
                            });
                          }}
                          className="text-blue-500 hover:text-blue-700 transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Size Wise Stock Entry (Sheets) */}
              {formData.stock_sizes && formData.stock_sizes.length > 0 && (
                <div className="mt-5 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <label className="block text-sm font-bold text-gray-700 mb-3">Size Wise Stock Entry</label>
                  <div className="space-y-4">
                     {formData.stock_sizes.map(sizeId => {
                        const stockSize = stockSizes.find(s => String(s._id) === String(sizeId));
                        const sizeStock = (formData.size_wise_stock || []).find(s => s.size_id === sizeId) || { count: "", sqinch: 0 };
                        return (
                           <div key={sizeId} className="flex items-center gap-4 bg-white p-3 rounded-md border border-gray-100 shadow-sm">
                             <div className="flex-1">
                                <span className="text-sm font-bold text-gray-800">{stockSize ? stockSize.size : 'Unknown'}</span>
                             </div>
                             <div className="w-1/3">
                                <label className="block text-[11px] font-semibold tracking-wider text-gray-500 mb-1 uppercase">Count</label>
                                <input 
                                  type="number" 
                                  placeholder="0" 
                                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-300 outline-none text-sm transition" 
                                  value={sizeStock.count} 
                                  onChange={(e) => handleSizeStockChange(sizeId, e.target.value, stockSize)} 
                                />
                             </div>
                             <div className="w-1/3">
                                <label className="block text-[11px] font-semibold tracking-wider text-gray-500 mb-1 uppercase">Total Sq. In.</label>
                                <input 
                                  type="number" 
                                  readOnly 
                                  className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded text-gray-600 text-sm font-medium outline-none cursor-not-allowed" 
                                  value={sizeStock.sqinch} 
                                />
                             </div>
                           </div>
                        )
                     })}

                </div>
              </div>
            )}</div>
          )}

          {/* Price, Cost, Unit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                name="price"
                value={formData.price}
                onKeyDown={(e) => {
                  if (["e", "E", "+", "-"].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  const cleaned = sanitizeDecimal(e.target.value);
                  handleChange({ target: { name: "price", value: cleaned } });
                }}
                placeholder="Selling price"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition ${fieldErrors.price
                  ? "border-red-500 focus:ring-red-300 focus:border-red-500"
                  : "border-gray-300 focus:ring-blue-300 focus:border-blue-500"
                  }`}
              />
              {fieldErrors.price && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.price}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cost (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                name="cost"
                value={formData.cost}
                onKeyDown={(e) => {
                  if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
                }}
                onChange={(e) => {
                  const cleaned = sanitizeDecimal(e.target.value);
                  handleChange({ target: { name: "cost", value: cleaned } });
                }}
                placeholder="Cost price"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition ${fieldErrors.cost
                  ? "border-red-500 focus:ring-red-300 focus:border-red-500"
                  : "border-gray-300 focus:ring-blue-300 focus:border-blue-500"
                  }`}
              />
              {fieldErrors.cost && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.cost}</p>
              )}
            </div>
          </div>

          {/* Stock, Min Stock, Max Stock */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Stock {formData.item_type === "sheet" && <span className="text-xs text-blue-600 font-normal">(Total Sq. In.)</span>}
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock !== undefined ? formData.stock : ""}
                onChange={handleChange}
                step="1"
                min="0"
                readOnly={formData.item_type === "sheet"}
                placeholder="Current stock"
                className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition ${formData.item_type === "sheet" ? "bg-gray-100 cursor-not-allowed text-gray-600" : ""}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Stock
              </label>
              <input
                type="number"
                name="min_stock"
                value={formData.min_stock}
                onChange={handleChange}
                step="1"
                min="0"
                placeholder="Minimum stock level"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Stock
              </label>
              <input
                type="number"
                name="max_stock"
                value={formData.max_stock}
                onChange={handleChange}
                step="1"
                min="0"
                placeholder="Maximum stock level"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          {/* Logic Rates (Only for 'logic' type) */}
          {formData.item_type === "logic" && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-bold text-gray-700 mb-3 flex justify-between items-center">
                <span>Logic Rates</span>
                <button
                  type="button"
                  onClick={addLogicRule}
                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition"
                >
                  + Add Rule
                </button>
              </h4>

              {(formData.logical_rate || []).length === 0 ? (
                <p className="text-xs text-gray-400 italic">No rules defined. Click "Add Rule" to start.</p>
              ) : (
                <div className="space-y-3">
                  {(formData.logical_rate || []).map((rule, idx) => (
                    <div key={idx} className="flex flex-wrap gap-2 items-end border-b border-gray-200 pb-3 last:border-0 last:pb-0">

                      {/* Field */}
                      <div className="w-24">
                        <label className="block text-[10px] text-gray-500 mb-1">Field</label>
                        <select
                          value={
                            (rule.condition?.field || "").toLowerCase() === "jobqty"
                              ? "jobQty"
                              : (rule.condition?.field || "logic1")
                          }
                          onChange={(e) => updateLogicRule(idx, "condition", "field", e.target.value)}
                          className="w-full text-xs px-2 py-1.5 border rounded focus:ring-1 focus:ring-blue-300 disabled:bg-gray-100 disabled:text-gray-500"
                          disabled={
                            formData.name === "Black Box (Custom)" ||
                            formData.name === "Thermocol (Custom)"
                          }
                        >
                          <option value="logic1">Logic 1</option>
                          <option value="logic2">Logic 2</option>
                          <option value="logic3">Logic 3</option>
                          <option value="jobQty">Job Qty</option>
                        </select>
                      </div>

                      {/* Operator */}
                      <div className="w-20">
                        <label className="block text-[10px] text-gray-500 mb-1">Operator</label>
                        <select
                          value={rule.condition?.operator || ">="}
                          onChange={(e) => updateLogicRule(idx, "condition", "operator", e.target.value)}
                          className="w-full text-xs px-2 py-1.5 border rounded focus:ring-1 focus:ring-blue-300"
                        >
                          <option value=">=">&ge;</option>
                          <option value=">">&gt;</option>
                          <option value="<=">&le;</option>
                          <option value="<">&lt;</option>
                          <option value="==">=</option>
                        </select>
                      </div>

                      {/* Value */}
                      <div className="flex-1 min-w-[80px]">
                        <label className="block text-[10px] text-gray-500 mb-1">Value</label>
                        <input
                          type="number"
                          value={rule.condition?.value || ""}
                          onChange={(e) => updateLogicRule(idx, "condition", "value", Number(e.target.value))}
                          placeholder="Threshold"
                          className="w-full text-xs px-2 py-1.5 border rounded focus:ring-1 focus:ring-blue-300"
                        />
                      </div>

                      {/* Rate */}
                      <div className="flex-1 min-w-[80px]">
                        <label className="block text-[10px] text-gray-500 mb-1">Rate (Price)</label>
                        <input
                          type="number"
                          value={rule.rate || ""}
                          onChange={(e) => updateLogicRule(idx, "root", "rate", e.target.value)}
                          placeholder="Rate"
                          className="w-full text-xs px-2 py-1.5 border rounded focus:ring-1 focus:ring-blue-300"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeLogicRule(idx)}
                        className="text-red-500 hover:text-red-700 p-1.5"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Vendors */}
          <div className="mb-6">
            <FormControl fullWidth variant="outlined" size="small">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vendors
              </label>
              <Select
                value=""
                displayEmpty
                size="small"
                onChange={(e) => {
                  const selectedId = e.target.value;

                  if (
                    selectedId &&
                    !(formData.supplier_ids || []).includes(selectedId)
                  ) {
                    setFormData({
                      ...formData,
                      supplier_ids: [
                        ...(formData.supplier_ids || []),
                        selectedId,
                      ],
                    });
                  }
                  e.target.value = "";
                }}
              >
                <MenuItem value="">
                  <span className="text-gray-400">Select vendor</span>
                </MenuItem>

                {vendors
                  .filter(
                    (vendor) =>
                      !(formData.supplier_ids || []).includes(vendor._id)
                  )
                  .map((vendor) => (
                    <MenuItem key={vendor._id} value={vendor._id}>
                      {capitalizeFirst(vendor.name)}
                      {vendor.service_category &&
                        ` - ${capitalizeFirst(vendor.service_category.name)}`}
                      {!vendor.is_active && " (Inactive)"}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            {/* Selected Vendors Display */}
            {formData.supplier_ids.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {formData.supplier_ids.map((supplierId) => {
                  const vendor = vendors.find(
                    (v) => String(v._id) === String(supplierId)
                  );
                  return (
                    <span
                      key={supplierId}
                      className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 border border-blue-200"
                    >
                      {vendor ? (
                        <>
                          {capitalizeFirst(vendor.name)}{" "}
                          {vendor.service_category?.name &&
                            `- ${capitalizeFirst(
                              vendor.service_category.name
                            )}`}
                          {!vendor.is_active && " (Inactive)"}
                        </>
                      ) : (
                        "Unknown (Not Found)"
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            supplier_ids: formData.supplier_ids.filter(
                              (id) => id !== supplierId
                            ),
                          })
                        }
                        className="text-blue-500 hover:text-blue-700 transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            {editingItem ? (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#574fdd" }}

              >
                {isSubmitting ? "Updating..." : "Update"}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-white border border-red-500 text-red-500 hover:bg-red-50 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#574fdd" }}
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemForm;