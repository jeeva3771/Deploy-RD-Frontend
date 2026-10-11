import React, { useState } from 'react'
import { FaEye, FaSearch, FaWhatsapp, FaEnvelope, FaShareAlt, FaWarehouse } from 'react-icons/fa'

// Sample data
const jobNumbers = [
  { id: '14555a', description: 'Corporate Awards Project' },
  { id: '14455', description: 'School Trophy Order' },
  { id: '12334b', description: 'Sports Medal Contract' },
]

const materials = [
  {
    id: 'ITM001',
    materialName: 'BLACK ACRYLIC 3MM',
    category: 'Acrylic',
    unit: 'sqft',
    cost: 45.0,
    stockQty: 150.5,
    size: '4ft x 8ft sheets',
  },
  {
    id: 'ITM002',
    materialName: 'BLACK ACRYLIC 6MM',
    category: 'Acrylic',
    unit: 'sqft',
    cost: 85.0,
    stockQty: 89.25,
    size: '4ft x 8ft sheets',
  },
]

const vendors = [
  {
    id: 'VEN001',
    name: 'Trophy Makers Ltd',
    contact: '+91-9876543210',
  },
  {
    id: 'VEN002',
    name: 'Medal Craft Industries',
    contact: '+91-9876543211',
  },
]

const initialPurchaseOrders = [
  {
    id: 'PO001',
    jobNo: '14555a',
    poDate: '2024-09-20',
    expectedDelivery: '2024-09-27',
    status: 'Pending',
    totalAmount: 1500.0,
  },
]

const PurchaseOrder = () => {
  const [purchaseOrders] = useState(initialPurchaseOrders)
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showOverview, setShowOverview] = useState(false)
  const [selectedPO, setSelectedPO] = useState(null)
  const [watermarkModalProduct, setWatermarkModalProduct] = useState(null)

  const [poData, setPoData] = useState({
    jobNo: '',
    poDate: new Date().toISOString().split('T')[0],
    expectedDelivery: '',
    items: materials.map((material) => ({
      materialId: material.id,
      materialName: material.materialName,
      category: material.category,
      unit: material.unit,
      stockQty: material.stockQty,
      size: material.size,
      vendorId: '',
      purchaseQty: '',
      rate: material.cost,
    })),
    notes: '',
    terms: 'Payment within 30 days',
  })

  const openWatermarkModal = (product) => {
    setWatermarkModalProduct(product)
    document.body.style.overflow = 'hidden'
  }

  const closeWatermarkModal = () => {
    setWatermarkModalProduct(null)
    document.body.style.overflow = 'unset'
  }

  const handleTickAction = () => {
    openWatermarkModal(1)
  }

  const generatePDF = () => {
    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .company-name { font-size: 24px; font-weight: bold; color: #2563eb; }
          .po-title { font-size: 20px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">Your Company Name</div>
          <div class="po-title">PURCHASE ORDER</div>
          <div>PO Number: PO001 | Job No: 14555a</div>
        </div>
      </body>
      </html>
    `
    const blob = new Blob([pdfContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `PO001_Udhaya_Ltd_${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleWhatsAppShare = () => {
    generatePDF()
    const message = encodeURIComponent(
      `Purchase Order PO001\nJob No: 14555a\nVendor: Udhaya Ltd\nAmount: ₹500`
    )
    const phone = '919393990949'
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
  }

  const handleEmailShare = () => {
    generatePDF()
    const subject = encodeURIComponent('Purchase Order PO001 - Udhaya Ltd')
    const body = encodeURIComponent(
      `Dear Vendor,\n\nPlease find attached the Purchase Order details:\n\nPO Number: PO001\nJob No: 14555a\nAmount: ₹500`
    )
    window.location.href = `mailto:vendor@udhayaltd.com?subject=${subject}&body=${body}`
  }

  const handleOverview = (po) => {
    setSelectedPO(po)
    setShowOverview(true)
  }

  const filteredPOs = purchaseOrders.filter((po) => {
    const matchesSearch = po.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === '' || po.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const WatermarkModal = ({ product, onClose }) => {
    if (!product) return null

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 w-full max-w-6xl max-h-[90vh] overflow-y-auto my-8">
          <div className="sticky top-0 bg-white border-b border-gray-100 px-4 sm:px-6 py-4 flex justify-between items-center">
            <h5 className="text-lg sm:text-xl font-bold text-blue-600">
              14555a - Purchase Order
              <span className="text-gray-500 ml-2 text-base">(PO001)</span>
            </h5>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-4 sm:p-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6">
              <div className="text-center mb-6">
                <h4 className="text-xl sm:text-2xl font-bold text-blue-600">Your Company Name</h4>
                <h5 className="text-lg sm:text-xl font-semibold mt-2">PURCHASE ORDER</h5>
                <p className="text-sm text-gray-600 mt-2">
                  PO Number: <strong>PO001</strong> | Job No: <strong>14555a</strong>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-700">
                    <strong>PO Date:</strong> {new Date().toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    <strong>Expected Delivery:</strong>{' '}
                    {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-4">
                <h6 className="font-semibold text-gray-900 mb-3">Vendor Details:</h6>
                <p className="text-sm text-gray-700 mb-1">
                  <strong>Udhaya Ltd</strong>
                </p>
                <p className="text-sm text-gray-600 mb-1">Contact: +91-9393990949</p>
                <p className="text-sm text-gray-700">
                  Amount: <strong className="text-green-600">₹500</strong>
                </p>
              </div>

              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-blue-600 text-white">
                    <tr>
                      <th className="px-3 py-2 text-left">Material</th>
                      <th className="px-3 py-2 text-left">Category</th>
                      <th className="px-3 py-2 text-center">Quantity</th>
                      <th className="px-3 py-2 text-left">Unit</th>
                      <th className="px-3 py-2 text-right">Rate (₹)</th>
                      <th className="px-3 py-2 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr className="border-b border-gray-200">
                      <td className="px-3 py-2">BLACK ACRYLIC 3MM</td>
                      <td className="px-3 py-2">Acrylic</td>
                      <td className="px-3 py-2 text-center">10</td>
                      <td className="px-3 py-2">sqft</td>
                      <td className="px-3 py-2 text-right">45.00</td>
                      <td className="px-3 py-2 text-right">450.00</td>
                    </tr>
                    <tr className="bg-gray-100 font-semibold">
                      <td colSpan="5" className="px-3 py-2 text-right">
                        Grand Total:
                      </td>
                      <td className="px-3 py-2 text-right">₹500.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  <strong>Terms & Conditions:</strong> Payment within 30 days
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Notes:</strong> Need good quality materials
                </p>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 sm:px-6 py-4 flex flex-wrap gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
              title="Share via WhatsApp"
            >
              <FaWhatsapp className="w-4 h-4" />
            </button>
            <button
              onClick={handleEmailShare}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
              title="Share via Email"
            >
              <FaEnvelope className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen mt-[5vh]">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold text-blue-600">Purchase Orders</h2>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors w-full sm:w-auto flex items-center justify-center gap-2" style={{ backgroundColor: "#574fdd" }}>
            <span>+</span>
            <span>Create Purchase Order</span>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-600 text-white rounded-lg p-4 text-center">
            <span className="text-3xl font-bold mb-1">4</span><br />
            <b className="text-sm">Total POs</b>
          </div>
          <div className="bg-blue-600 text-white rounded-lg p-4 text-center">
            <span className="text-3xl font-bold mb-1">1</span><br />
            <b className="text-sm">Pending POs</b>
          </div>
          <div className="bg-blue-600 text-white rounded-lg p-4 text-center">
            <span className="text-3xl font-bold mb-1">1</span><br />
            <b className="text-sm">Completed POs</b>
          </div>
          <div className="bg-blue-600 text-white rounded-lg p-4 text-center">
            <span className="text-3xl font-bold mb-1">₹3000</span><br />
            <b className="text-sm">Total Value</b>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                  placeholder="Search by PO number, job number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div>
              <select
                className="appearance-none w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition bg-white"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table - Desktop View */}
        <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Job No.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    PO Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Expected Delivery
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredPOs.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                        {po.jobNo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{po.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{po.poDate}</td>
                    <td className="px-4 py-3 text-sm text-gray-700"></td>
                    <td className="px-4 py-3 text-sm">
                      <span className="font-semibold text-gray-900">150</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900">
                      ₹{po.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{po.expectedDelivery}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="text-yellow-600 font-bold text-xs">Pending</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex space-x-2">
                        <button
                          className="p-2 rounded border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors"
                          onClick={() => handleOverview(po)}
                          title="View Overview"
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">PO002</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-sm">
                    <div className="text-gray-600">Ram Ltd</div>
                    <div className="text-xs text-gray-500">+91-9666543211</div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">50</td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900">₹1000</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-sm">
                    <span className="text-green-600 font-bold text-xs">Completed</span>
                  </td>
                  <td className="px-4 py-3"></td>
                </tr>

                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">PO003</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-sm">
                    <div className="text-gray-600">Praveen Ltd</div>
                    <div className="text-xs text-gray-500">+91-9666543291</div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">50</td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900">₹500</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-sm">
                    <span className="text-yellow-600 font-bold text-xs">Pending</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button className="px-3 py-1.5 text-xs border border-blue-600 text-blue-600 hover:bg-blue-50 rounded transition-colors flex items-center gap-1">
                      <FaWarehouse className="w-3 h-3" />
                      Stock Inward
                    </button>
                  </td>
                </tr>

                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">PO004</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-sm">
                    <div className="text-gray-600">Udhaya Ltd</div>
                    <div className="text-xs text-gray-500">+91-9633543290</div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">50</td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900">₹500</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-sm">
                    <span className="text-yellow-600 font-bold text-xs">Pending</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => handleTickAction()}
                      className="px-3 py-1.5 text-xs border border-blue-600 text-blue-600 hover:bg-blue-50 rounded transition-colors flex items-center gap-1"
                    >
                      <FaShareAlt className="w-3 h-3" />
                      Share
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {filteredPOs.map((po) => (
            <div key={po.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-xs font-semibold text-gray-500">PO Number</span>
                  <p className="text-lg font-bold text-gray-900">{po.id}</p>
                </div>
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                  {po.jobNo}
                </span>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium text-gray-900">{po.poDate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-semibold text-gray-900">150</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-bold text-gray-900">₹{po.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-yellow-600 font-bold text-xs">Pending</span>
                </div>
              </div>

              <button
                onClick={() => handleOverview(po)}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <FaEye className="w-4 h-4" />
                View Details
              </button>
            </div>
          ))}

          {/* Additional PO Cards */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-xs font-semibold text-gray-500">PO Number</span>
                <p className="text-lg font-bold text-gray-900">PO002</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Vendor:</span>
                <div className="text-right">
                  <div className="font-medium text-gray-900">Ram Ltd</div>
                  <div className="text-xs text-gray-500">+91-9666543211</div>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-semibold text-gray-900">50</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount:</span>
                <span className="font-bold text-gray-900">₹1000</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <span className="text-green-600 font-bold text-xs">Completed</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-xs font-semibold text-gray-500">PO Number</span>
                <p className="text-lg font-bold text-gray-900">PO004</p>
              </div>
            </div>
            <div className="space-y-2 mb-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Vendor:</span>
                <div className="text-right">
                  <div className="font-medium text-gray-900">Udhaya Ltd</div>
                  <div className="text-xs text-gray-500">+91-9633543290</div>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-semibold text-gray-900">50</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount:</span>
                <span className="font-bold text-gray-900">₹500</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <span className="text-yellow-600 font-bold text-xs">Pending</span>
              </div>
            </div>
            <button
              onClick={() => handleTickAction()}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <FaShareAlt className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Overview Modal */}
      {showOverview && selectedPO && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-7xl max-h-[90vh] overflow-y-auto my-8">
            <div className="sticky top-0 bg-gray-50 border-b border-gray-100 px-4 sm:px-6 py-4 flex justify-between items-center">
              <h5 className="text-lg sm:text-xl font-bold text-blue-600">
                Purchase Order Overview - {selectedPO.id}
              </h5>
              <button
                onClick={() => {
                  setShowOverview(false)
                  setSelectedPO(null)
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {/* General Information */}
              <div className="mb-6">
                <h6 className="text-base font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">
                  General Information
                </h6>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <span className="text-sm font-semibold text-gray-700">Job No:</span>
                    <p className="text-sm text-gray-900">{selectedPO.jobNo}</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-700">PO Date:</span>
                    <p className="text-sm text-gray-900">{selectedPO.poDate}</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-700">Expected Delivery:</span>
                    <p className="text-sm text-gray-900">{selectedPO.expectedDelivery || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-700">Status:</span>
                    <p className="text-sm">
                      <span className="text-yellow-600 font-bold">{selectedPO.status}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-6">
                <h6 className="text-base font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">
                  Items
                </h6>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-blue-600 text-white">
                      <tr>
                        <th className="px-3 py-2 text-left">PO No.</th>
                        <th className="px-3 py-2 text-left">Material</th>
                        <th className="px-3 py-2 text-left">Category</th>
                        <th className="px-3 py-2 text-center">Stock Qty</th>
                        <th className="px-3 py-2 text-left">Unit</th>
                        <th className="px-3 py-2 text-left">Vendor</th>
                        <th className="px-3 py-2 text-center">Required Qty</th>
                        <th className="px-3 py-2 text-center">Purchase Qty</th>
                        <th className="px-3 py-2 text-right">Rate (₹)</th>
                        <th className="px-3 py-2 text-right">Total (₹)</th>
                        <th className="px-3 py-2 text-left">Terms</th>
                        <th className="px-3 py-2 text-left">Notes</th>
                        <th className="px-3 py-2 text-center">Status</th>
                        <th className="px-3 py-2 text-center">Vendor Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {[1, 2, 3, 4, 5].map((idx) => (
                        <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-3 py-2">PO00{idx}</td>
                          <td className="px-3 py-2">
                            <div className="font-semibold text-gray-900">ITM001 - BLACK ACRYLIC 3MM</div>
                            <div className="text-xs text-gray-500">4ft x 8ft</div>
                          </td>
                          <td className="px-3 py-2 text-gray-700">Acrylic</td>
                          <td className="px-3 py-2 text-center text-gray-700">10</td>
                          <td className="px-3 py-2 text-gray-700">sqft</td>
                          <td className="px-3 py-2">
                            {idx !== 4 ? (
                              <>
                                <div className="text-gray-900">Ram Ltd</div>
                                <div className="text-xs text-gray-500">+91-9876543210</div>
                              </>
                            ) : null}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className="font-bold text-blue-600">60</span>
                          </td>
                          <td className="px-3 py-2 text-center text-gray-900">70</td>
                          <td className="px-3 py-2 text-right text-gray-900">₹100.00</td>
                          <td className="px-3 py-2 text-right font-bold text-gray-900">₹1000.00</td>
                          <td className="px-3 py-2 text-gray-700">Payment within 30 days</td>
                          <td className="px-3 py-2 text-gray-700">Need good quality</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`font-bold text-xs ${idx === 4 ? 'text-yellow-600' : 'text-green-600'}`}>
                              {idx === 4 ? 'Pending' : 'Completed'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className="text-green-600 text-lg font-bold">✓</span>
                          </td>
                        </tr>
                      ))}

                      <tr className="border-b border-gray-200">
                        <td className="px-3 py-2">PO006</td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2">
                          <div className="text-gray-900">SriRam Ltd</div>
                          <div className="text-xs text-gray-500">+91-9666543211</div>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-900">20</td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2 text-center">
                          <span className="text-green-600 font-bold text-xs">Completed</span>
                        </td>
                        <td className="px-3 py-2"></td>
                      </tr>

                      <tr className="bg-gray-100 font-semibold">
                        <td colSpan="9" className="px-3 py-2 text-right">Total Amount:</td>
                        <td className="px-3 py-2 text-right text-green-600">₹{selectedPO.totalAmount.toFixed(2)}</td>
                        <td colSpan="4"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4">
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">
                          PO00{idx}
                        </span>
                        <span className={`font-bold text-xs ${idx === 4 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {idx === 4 ? 'Pending' : 'Completed'}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <span className="text-xs font-semibold text-gray-500">Material</span>
                          <p className="text-sm font-semibold text-gray-900">ITM001 - BLACK ACRYLIC 3MM</p>
                          <p className="text-xs text-gray-500">4ft x 8ft | Acrylic</p>
                        </div>

                        {idx !== 4 && (
                          <div>
                            <span className="text-xs font-semibold text-gray-500">Vendor</span>
                            <p className="text-sm text-gray-900">Ram Ltd</p>
                            <p className="text-xs text-gray-500">+91-9876543210</p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-xs text-gray-500">Stock Qty:</span>
                            <p className="text-sm font-medium text-gray-900">10 sqft</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Required:</span>
                            <p className="text-sm font-bold text-blue-600">60</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Purchase:</span>
                            <p className="text-sm font-medium text-gray-900">70</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Rate:</span>
                            <p className="text-sm font-medium text-gray-900">₹100.00</p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-gray-200">
                          <div className="flex justify-between">
                            <span className="text-sm font-semibold text-gray-700">Total:</span>
                            <span className="text-sm font-bold text-gray-900">₹1000.00</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-gray-600">
                            <strong>Terms:</strong> Payment within 30 days
                          </p>
                          <p className="text-xs text-gray-600">
                            <strong>Notes:</strong> Need good quality
                          </p>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                          <span className="text-xs text-gray-500">Vendor Status:</span>
                          <span className="text-green-600 text-xl font-bold">✓</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-900">Total Amount:</span>
                      <span className="text-lg font-bold text-green-600">
                        ₹{selectedPO.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 px-4 sm:px-6 py-4 flex flex-wrap gap-3 justify-end">
              <button
                onClick={() => {
                  setShowOverview(false)
                  setSelectedPO(null)
                }}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg transition-colors"
              >
                Close
              </button>
              <button className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Watermark Modal */}
      {watermarkModalProduct && (
        <WatermarkModal product={watermarkModalProduct} onClose={closeWatermarkModal} />
      )}
    </div>
  )
}

export default PurchaseOrder