import React, { useState } from 'react'
import { FaArrowLeft, FaPlus, FaTrash, FaInfoCircle } from 'react-icons/fa'

const jobNumbers = [
  { id: '14555a', description: 'Corporate Awards Project' },
  { id: '14455', description: 'School Trophy Order' },
  { id: '12334b', description: 'Sports Medal Contract' },
  { id: '15678c', description: 'Anniversary Plaques' },
  { id: '13456', description: 'Custom Engraving Job' },
  { id: '16789d', description: 'Wedding Gifts Order' },
]

const materials = [
  {
    id: 'ITM001',
    materialName: 'BLACK ACRYLIC 3MM',
    category: 'Acrylic',
    unit: 'sqft',
    cost: 45.0,
    stockQty: 150.5,
    description: 'Black acrylic sheet, 3mm thickness',
    size: '4ft x 8ft sheets',
  },
  {
    id: 'ITM002',
    materialName: 'BLACK ACRYLIC 6MM',
    category: 'Acrylic',
    unit: 'sqft',
    cost: 85.0,
    stockQty: 89.25,
    description: 'Black acrylic sheet, 6mm thickness',
    size: '4ft x 8ft sheets',
  },
  {
    id: 'ITM005',
    materialName: 'CLEAR ACRYLIC 3MM',
    category: 'Acrylic',
    unit: 'sqft',
    cost: 50.0,
    stockQty: 120.75,
    description: 'Clear acrylic sheet, 3mm thickness',
    size: '4ft x 8ft sheets',
  },
  {
    id: 'ITM006',
    materialName: 'CLEAR ACRYLIC 6MM',
    category: 'Acrylic',
    unit: 'sqft',
    cost: 90.0,
    stockQty: 45.0,
    description: 'Clear acrylic sheet, 6mm thickness',
    size: '4ft x 8ft sheets',
  },
]

const vendors = [
  {
    id: 'VEN001',
    name: 'Trophy Makers Ltd',
    contact: '+91-9876543210',
    email: 'contact@trophymakers.com',
    address: '123 Industrial Area, Mumbai',
  },
  {
    id: 'VEN002',
    name: 'Medal Craft Industries',
    contact: '+91-9876543211',
    email: 'sales@medalcraft.com',
    address: '456 Manufacturing Zone, Delhi',
  },
  {
    id: 'VEN003',
    name: 'Crystal Works Co.',
    contact: '+91-9876543212',
    email: 'orders@crystalworks.com',
    address: '789 Glass Street, Bangalore',
  },
]

const NewPurchaseOrder = () => {
  const [poData, setPoData] = useState({
    jobNo: '',
    poDate: new Date().toISOString().split('T')[0],
    expectedDelivery: '',
    items: materials.map((material, index) => ({
      id: `${material.id}-1`,
      materialId: material.id,
      materialName: material.materialName,
      category: material.category,
      unit: material.unit,
      stockQty: material.stockQty,
      size: material.size,
      vendorId: '',
      purchaseQty: '',
      rate: material.cost,
      requiredQty: material.id === 'ITM006' ? 50 : 60,
      isMainRow: true,
      rowNumber: 1,
      terms: '',
      notes: '',
    })),
    status: 'Draft',
  })

  const updateItemRow = (rowId, field, value) => {
    const updatedItems = poData.items.map((item) => {
      if (item.id === rowId) {
        return { ...item, [field]: value }
      }
      return item
    })
    setPoData({ ...poData, items: updatedItems })
  }

  const deleteItem = (rowId) => {
    const item = poData.items.find((i) => i.id === rowId)
    const materialRows = poData.items.filter((i) => i.materialId === item.materialId)

    if (materialRows.length === 1) {
      alert('Cannot delete the only row for this material')
      return
    }

    const updatedItems = poData.items.filter((item) => item.id !== rowId)
    setPoData({ ...poData, items: updatedItems })
  }

  const addVendorRow = (materialId) => {
    const material = materials.find((m) => m.id === materialId)
    const existingRows = poData.items.filter((item) => item.materialId === materialId)
    const newRowNumber = existingRows.length + 1

    const newRow = {
      id: `${materialId}-${newRowNumber}`,
      materialId: materialId,
      materialName: material.materialName,
      category: material.category,
      unit: material.unit,
      stockQty: material.stockQty,
      size: material.size,
      vendorId: '',
      purchaseQty: '',
      rate: material.cost,
      requiredQty: existingRows[0].requiredQty,
      isMainRow: false,
      rowNumber: newRowNumber,
      terms: '',
      notes: '',
    }

    const lastRowIndex = poData.items.findLastIndex((item) => item.materialId === materialId)
    const updatedItems = [...poData.items]
    updatedItems.splice(lastRowIndex + 1, 0, newRow)

    setPoData({ ...poData, items: updatedItems })
  }

  const handleSubmit = () => {
    if (!poData.jobNo) {
      alert('Please select a Job Number')
      return
    }

    const itemsWithQuantity = poData.items.filter((item) => item.purchaseQty > 0)
    if (itemsWithQuantity.length === 0) {
      alert('Please enter purchase quantities for at least one item')
      return
    }

    const itemsWithoutVendor = itemsWithQuantity.filter((item) => !item.vendorId)
    if (itemsWithoutVendor.length > 0) {
      alert('Please select vendors for all items with purchase quantities')
      return
    }

    const totalAmount = itemsWithQuantity.reduce(
      (sum, item) => sum + item.purchaseQty * item.rate,
      0,
    )

    const newPO = {
      id: `PO${Date.now()}`,
      jobNo: poData.jobNo,
      poDate: poData.poDate,
      expectedDelivery: poData.expectedDelivery,
      items: itemsWithQuantity.map((item) => ({
        ...item,
        vendorName: vendors.find((v) => v.id === item.vendorId)?.name,
        total: item.purchaseQty * item.rate,
      })),
      totalAmount,
      status: poData.status,
      createdDate: new Date().toISOString().split('T')[0],
    }

    console.log('New Purchase Order:', newPO)
    alert(`Purchase Order ${newPO.id} created successfully!`)
  }

  const totalAmount = poData.items.reduce((sum, i) => sum + (i.purchaseQty || 0) * i.rate, 0)

  return (
    <div className="bg-gray-50 min-h-screen mt-[5vh]">
      <div className="container mx-auto px-4 py-6 max-w-[1500px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold text-blue-600">Create Purchase Order</h2>
          <button className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg transition-colors flex items-center gap-2">
            <FaArrowLeft className="w-4 h-4" />
            Back to PO List
          </button>
        </div>

        {/* Form Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          {/* Job Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Number <span className="text-red-500">*</span>
              </label>
              <select
                className="appearance-none w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition bg-white"
                value={poData.jobNo}
                onChange={(e) => setPoData({ ...poData, jobNo: e.target.value })}
              >
                <option value="">Select Job Number</option>
                {jobNumbers.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.id} - {job.description}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PO Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                value={poData.poDate}
                onChange={(e) => setPoData({ ...poData, poDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Delivery
              </label>
              <input
                type="date"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                value={poData.expectedDelivery}
                onChange={(e) => setPoData({ ...poData, expectedDelivery: e.target.value })}
              />
            </div>
          </div>

          {/* Materials List Header */}
          <div className="flex justify-between items-center mb-4">
            <label className="text-base font-bold text-gray-900">
              Materials List <span className="text-red-500">*</span>
            </label>
          </div>

          {/* Desktop Table View */}
          <div className="hidden xl:block overflow-x-auto mb-6">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Stock Qty
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Required Qty
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Purchase Qty
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Rate (₹)
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Total (₹)
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Terms
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {poData.items.map((item) => {
                  const total = (item.purchaseQty || 0) * item.rate
                  const isAdditionalRow = !item.isMainRow
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        isAdditionalRow ? 'bg-gray-50 border-l-4 border-green-500' : ''
                      }`}
                    >
                      <td className="px-3 py-3 text-left">
                        <div className="font-semibold text-gray-900">
                          {item.isMainRow ? (
                            <>
                              {item.materialId} - {item.materialName}
                            </>
                          ) : (
                            <span className="text-gray-500">
                              ↳ Additional Vendor #{item.rowNumber}
                            </span>
                          )}
                        </div>
                        {item.isMainRow && (
                          <div className="text-xs text-gray-500 mt-1">
                            {materials.find((m) => m.id === item.materialId)?.description},{' '}
                            {item.size}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center text-gray-700">
                        {item.isMainRow ? item.category : '-'}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {item.isMainRow && (
                          <span
                            className={`font-bold ${
                              item.stockQty < 50 ? 'text-red-600' : 'text-green-600'
                            }`}
                          >
                            {item.stockQty}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center text-gray-700">
                        {item.isMainRow ? item.unit : '-'}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <select
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition bg-white"
                            value={item.vendorId}
                            onChange={(e) => updateItemRow(item.id, 'vendorId', e.target.value)}
                          >
                            <option value="">Select Vendor</option>
                            {vendors.map((vendor) => (
                              <option key={vendor.id} value={vendor.id}>
                                {vendor.name}
                              </option>
                            ))}
                          </select>
                          {item.isMainRow && (
                            <button
                              type="button"
                              className="px-2 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs transition-colors"
                              onClick={() => addVendorRow(item.materialId)}
                              title="Add another vendor"
                            >
                              <FaPlus className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {item.isMainRow && <span className="font-bold text-gray-900">{item.requiredQty}</span>}
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition text-center"
                          value={item.purchaseQty}
                          min="0"
                          step="0.01"
                          onChange={(e) =>
                            updateItemRow(item.id, 'purchaseQty', parseFloat(e.target.value) || 0)
                          }
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          className="w-20 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition text-center"
                          value={item.rate}
                          min="0"
                          step="0.01"
                          onChange={(e) =>
                            updateItemRow(item.id, 'rate', parseFloat(e.target.value) || 0)
                          }
                        />
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-gray-900">
                        {total > 0 ? `₹${total.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-3 py-3">
                        <textarea
                          className="w-36 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition resize-none"
                          value={item.terms}
                          onChange={(e) => updateItemRow(item.id, 'terms', e.target.value)}
                          rows="2"
                          placeholder="Terms..."
                        />
                      </td>
                      <td className="px-3 py-3">
                        <textarea
                          className="w-36 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition resize-none"
                          value={item.notes}
                          onChange={(e) => updateItemRow(item.id, 'notes', e.target.value)}
                          rows="2"
                          placeholder="Notes..."
                        />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          className="p-2 rounded border border-red-600 text-red-600 hover:bg-red-50 transition-colors"
                          onClick={() => deleteItem(item.id)}
                          title="Delete"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan="8" className="px-3 py-3 text-right text-gray-900">
                    Total Amount:
                  </td>
                  <td className="px-3 py-3 text-center text-green-600 font-bold">
                    ₹{totalAmount.toFixed(2)}
                  </td>
                  <td colSpan="3"></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="xl:hidden space-y-4 mb-6">
            {poData.items.map((item) => {
              const total = (item.purchaseQty || 0) * item.rate
              const isAdditionalRow = !item.isMainRow
              return (
                <div
                  key={item.id}
                  className={`rounded-lg border p-4 ${
                    isAdditionalRow
                      ? 'bg-gray-50 border-l-4 border-green-500'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 mb-1">
                        {item.isMainRow ? (
                          <>
                            {item.materialId} - {item.materialName}
                          </>
                        ) : (
                          <span className="text-gray-500">
                            ↳ Additional Vendor #{item.rowNumber}
                          </span>
                        )}
                      </div>
                      {item.isMainRow && (
                        <div className="text-xs text-gray-500">
                          {materials.find((m) => m.id === item.materialId)?.description}, {item.size}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="p-2 rounded border border-red-600 text-red-600 hover:bg-red-50 transition-colors ml-2"
                      onClick={() => deleteItem(item.id)}
                      title="Delete"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {item.isMainRow && (
                      <>
                        <div>
                          <span className="text-xs font-semibold text-gray-500">Category</span>
                          <p className="text-sm text-gray-900">{item.category}</p>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-gray-500">Stock Qty</span>
                          <p
                            className={`text-sm font-bold ${
                              item.stockQty < 50 ? 'text-red-600' : 'text-green-600'
                            }`}
                          >
                            {item.stockQty} {item.unit}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-gray-500">Required Qty</span>
                          <p className="text-sm font-bold text-gray-900">{item.requiredQty}</p>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">
                        Vendor {item.isMainRow && <span className="text-red-500">*</span>}
                      </label>
                      <div className="flex gap-2">
                        <select
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition bg-white"
                          value={item.vendorId}
                          onChange={(e) => updateItemRow(item.id, 'vendorId', e.target.value)}
                        >
                          <option value="">Select Vendor</option>
                          {vendors.map((vendor) => (
                            <option key={vendor.id} value={vendor.id}>
                              {vendor.name}
                            </option>
                          ))}
                        </select>
                        {item.isMainRow && (
                          <button
                            type="button"
                            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs transition-colors"
                            onClick={() => addVendorRow(item.materialId)}
                          >
                            <FaPlus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                          Purchase Qty
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                          value={item.purchaseQty}
                          min="0"
                          step="0.01"
                          onChange={(e) =>
                            updateItemRow(item.id, 'purchaseQty', parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                          Rate (₹)
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                          value={item.rate}
                          min="0"
                          step="0.01"
                          onChange={(e) =>
                            updateItemRow(item.id, 'rate', parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">
                        Terms & Conditions
                      </label>
                      <textarea
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition resize-none"
                        value={item.terms}
                        onChange={(e) => updateItemRow(item.id, 'terms', e.target.value)}
                        rows="2"
                        placeholder="Enter terms..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">
                        Notes
                      </label>
                      <textarea
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition resize-none"
                        value={item.notes}
                        onChange={(e) => updateItemRow(item.id, 'notes', e.target.value)}
                        rows="2"
                        placeholder="Enter notes..."
                      />
                    </div>

                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-700">Total:</span>
                        <span className="text-lg font-bold text-gray-900">
                          {total > 0 ? `₹${total.toFixed(2)}` : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Total Amount Card */}
            <div className="bg-gray-100 rounded-lg border border-gray-200 p-4">
              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-gray-900">Total Amount:</span>
                <span className="text-xl font-bold text-green-600">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg transition-colors w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors w-full sm:w-auto"
                style={{ backgroundColor: "#574fdd" }}
            >
              Create PO
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewPurchaseOrder