import React, { useState } from 'react'
import { FaBoxOpen, FaFileInvoice, FaClipboardCheck, FaSearch, FaEye, FaPrint, FaChevronDown, FaChevronRight } from 'react-icons/fa'

// Sample data
const initialPurchaseOrders = [
  {
    id: 'PO001',
    date: '2024-09-15',
    orderNo: 'PO001',
    jobNo: '14555',
    vendor: 'Trophy Makers Ltd',
    totalQty: 150,
    receivedQty: 100,
    pendingQty: 50,
    status: 'Partial',
    invoiceNo: 'INV-2024-001',
    challanNo: 'CH-001',
    mimNo: 'MIN-001',
    qcStatus: 'Pending',
  },
  {
    id: 'PO002',
    date: '2024-09-18',
    orderNo: 'PO002',
    jobNo: '14455',
    vendor: 'Medal Works Pvt Ltd',
    totalQty: 200,
    receivedQty: 200,
    pendingQty: 0,
    status: 'Completed',
    invoiceNo: 'INV-2024-002',
    challanNo: 'CH-002',
    mimNo: 'MIN-002',
    qcStatus: 'Completed',
  },
]

const initialGRNs = [
  {
    id: 'GRN001',
    grnNo: 'GRN001',
    date: '2024-09-18',
    poNo: 'PO001',
    jobNo: '14555',
    vendor: 'Trophy Makers Ltd',
    invoiceNo: 'INV-2024-001',
    challanNo: 'CH-001',
    mimNo: 'MIN-001',
    receivedQty: 100,
    rejectedQty: 5,
    qcStatus: 'Completed',
    remarks: 'Good quality materials',
  },
  {
    id: 'GRN002',
    grnNo: 'GRN002',
    date: '2024-09-20',
    poNo: 'PO002',
    jobNo: '14455',
    vendor: 'Medal Works Pvt Ltd',
    invoiceNo: 'INV-2024-002',
    challanNo: 'CH-002',
    mimNo: 'MIN-002',
    receivedQty: 120,
    rejectedQty: 0,
    qcStatus: 'Completed',
    remarks: 'Perfect condition',
  },
]

const POGRNStatusList = () => {
  const [activeTab, setActiveTab] = useState('po')
  const [purchaseOrders] = useState(initialPurchaseOrders)
  const [grns] = useState(initialGRNs)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showPOOverview, setShowPOOverview] = useState(false)
  const [showGRNOverview, setShowGRNOverview] = useState(false)
  const [selectedPO, setSelectedPO] = useState(null)
  const [selectedGRN, setSelectedGRN] = useState(null)

  const handlePOOverview = (po) => {
    setSelectedPO(po)
    setShowPOOverview(true)
  }

  const handleGRNOverview = (grn) => {
    setSelectedGRN(grn)
    setShowGRNOverview(true)
  }

  const filteredPOs = purchaseOrders.filter((po) => {
    const matchesSearch =
      po.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.jobNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.vendor.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === '' || po.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const filteredGRNs = grns.filter((grn) => {
    const matchesSearch =
      grn.grnNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grn.poNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grn.jobNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grn.vendor.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === '' || grn.qcStatus === filterStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="bg-gray-50 min-h-screen mt-[5vh]">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
            <FaBoxOpen className="w-6 h-6" />
            Stock Inward
          </h2>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-600 text-white rounded-lg p-4 text-center">
            <span className="text-3xl font-bold mb-1">{purchaseOrders.length}</span><br />
            <b className="text-sm">Total Purchase Orders</b>
          </div>
          <div className="bg-yellow-500 text-white rounded-lg p-4 text-center">
            <span className="text-3xl font-bold mb-1">
              {purchaseOrders.filter((po) => po.status === 'Pending').length}
            </span><br />
            <b className="text-sm">Pending POs</b>
          </div>
          <div className="bg-green-600 text-white rounded-lg p-4 text-center">
            <span className="text-3xl font-bold mb-1">{grns.length}</span><br />
            <b className="text-sm">Total GRNs</b>
          </div>
          <div className="bg-cyan-500 text-white rounded-lg p-4 text-center">
            <span className="text-3xl font-bold mb-1">
              {grns.filter((grn) => grn.qcStatus === 'Pending').length}
            </span><br />
            <b className="text-sm">Pending QC</b>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-t-xl shadow-sm border border-gray-200 border-b-0">
          <div className="flex overflow-x-auto">
            <button
              className={`flex-1 sm:flex-none px-6 py-3 font-medium transition-colors flex items-center justify-center gap-2 border-b-2 ${activeTab === 'po'
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              onClick={() => {
                setActiveTab('po')
                setSearchTerm('')
                setFilterStatus('')
              }}
            >
              <FaFileInvoice className="w-4 h-4" />
              Purchase Orders
            </button>
            <button
              className={`flex-1 sm:flex-none px-6 py-3 font-medium transition-colors flex items-center justify-center gap-2 border-b-2 ${activeTab === 'grn'
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              onClick={() => {
                setActiveTab('grn')
                setSearchTerm('')
                setFilterStatus('')
              }}
            >
              <FaClipboardCheck className="w-4 h-4" />
              GRN Records
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-b-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                  placeholder={
                    activeTab === 'po'
                      ? 'Search by PO No, Job No, or Vendor...'
                      : 'Search by GRN No, PO No, Job No, or Vendor...'
                  }
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
                {activeTab === 'po' ? (
                  <>
                    <option value="Pending">Pending</option>
                    <option value="Partial">Partial</option>
                    <option value="Completed">Completed</option>
                  </>
                ) : (
                  <>
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Purchase Orders Table/Cards */}
        {activeTab === 'po' && (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-blue-600 text-white px-6 py-3">
                <h5 className="font-semibold flex items-center gap-2">
                  <FaFileInvoice />
                  Purchase Order Status
                </h5>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Job No.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        PO No.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Vendor
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                        Total Qty
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                        Received
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                        Pending
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                        Progress
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPOs.map((po) => {
                      const progressPercentage = po.totalQty
                        ? (po.receivedQty / po.totalQty) * 100
                        : 0
                      return (
                        <tr key={po.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                              {po.jobNo}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900">
                            {po.orderNo}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{po.date}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{po.vendor}</td>
                          <td className="px-4 py-3 text-center font-semibold text-gray-900">
                            {po.totalQty}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-green-600">
                            {po.receivedQty}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-red-600">
                            {po.pendingQty}
                          </td>
                          <td className="px-4 py-3">
                            <div className="w-full bg-gray-200 rounded-full h-5 overflow-hidden">
                              <div
                                className={`h-full flex items-center justify-center text-xs font-semibold text-white ${progressPercentage === 100
                                    ? 'bg-green-600'
                                    : progressPercentage > 0
                                      ? 'bg-yellow-500'
                                      : 'bg-gray-400'
                                  }`}
                                style={{ width: `${progressPercentage}%` }}
                              >
                                {progressPercentage.toFixed(0)}%
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`font-bold text-xs ${po.status === 'Completed'
                                  ? 'text-green-600'
                                  : po.status === 'Pending'
                                    ? 'text-yellow-600'
                                    : 'text-red-600'
                                }`}
                            >
                              {po.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handlePOOverview(po)}
                                className="p-2 rounded border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors"
                                title="View Details"
                              >
                                <FaEye className="w-4 h-4" />
                              </button>
                              <button
                                className="p-2 rounded border border-green-600 text-green-600 hover:bg-green-50 transition-colors"
                                title="Print"
                                disabled={po.pendingQty === 0}
                              >
                                <FaPrint className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              {filteredPOs.map((po) => {
                const progressPercentage = po.totalQty
                  ? (po.receivedQty / po.totalQty) * 100
                  : 0
                return (
                  <div key={po.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-xs font-semibold text-gray-500">PO Number</span>
                        <p className="text-lg font-bold text-gray-900">{po.orderNo}</p>
                      </div>
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                        {po.jobNo}
                      </span>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium text-gray-900">{po.date}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Vendor:</span>
                        <span className="font-medium text-gray-900">{po.vendor}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Qty:</span>
                        <span className="font-semibold text-gray-900">{po.totalQty}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Received:</span>
                        <span className="font-semibold text-green-600">{po.receivedQty}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Pending:</span>
                        <span className="font-semibold text-red-600">{po.pendingQty}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Status:</span>
                        <span
                          className={`font-bold text-xs ${po.status === 'Completed'
                              ? 'text-green-600'
                              : po.status === 'Pending'
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}
                        >
                          {po.status}
                        </span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <span className="text-xs text-gray-600">Progress</span>
                      <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden mt-1">
                        <div
                          className={`h-full flex items-center justify-center text-sm font-semibold text-white ${progressPercentage === 100
                              ? 'bg-green-600'
                              : progressPercentage > 0
                                ? 'bg-yellow-500'
                                : 'bg-gray-400'
                            }`}
                          style={{ width: `${progressPercentage}%` }}
                        >
                          {progressPercentage.toFixed(0)}%
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePOOverview(po)}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <FaEye className="w-4 h-4" />
                        View Details
                      </button>
                      <button
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        disabled={po.pendingQty === 0}
                      >
                        <FaPrint className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* GRN Records Table/Cards */}
        {activeTab === 'grn' && (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-green-600 text-white px-6 py-3">
                <h5 className="font-semibold flex items-center gap-2">
                  <FaClipboardCheck />
                  GRN Records
                </h5>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Job No.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        GRN No.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        PO No.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Vendor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Invoice No.
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                        Received Qty
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                        Rejected Qty
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                        QC Status
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredGRNs.map((grn) => (
                      <tr key={grn.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                            {grn.jobNo}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-green-600">{grn.grnNo}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{grn.date}</td>
                        <td className="px-4 py-3">
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                            {grn.poNo}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{grn.vendor}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{grn.invoiceNo}</td>
                        <td className="px-4 py-3 text-center font-semibold text-green-600">
                          {grn.receivedQty}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-red-600">
                          {grn.rejectedQty}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`font-bold text-xs ${grn.qcStatus === 'Completed'
                                ? 'text-green-600'
                                : 'text-yellow-600'
                              }`}
                          >
                            {grn.qcStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleGRNOverview(grn)}
                              className="p-2 rounded border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors"
                              title="View Details"
                            >
                              <FaEye className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 rounded border border-green-600 text-green-600 hover:bg-green-50 transition-colors"
                              title="Print"
                            >
                              <FaPrint className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              {filteredGRNs.map((grn) => (
                <div key={grn.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-xs font-semibold text-gray-500">GRN Number</span>
                      <p className="text-lg font-bold text-green-600">{grn.grnNo}</p>
                    </div>
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                      {grn.jobNo}
                    </span>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium text-gray-900">{grn.date}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">PO No:</span>
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                        {grn.poNo}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Vendor:</span>
                      <span className="font-medium text-gray-900">{grn.vendor}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Invoice:</span>
                      <span className="font-semibold text-gray-900">{grn.invoiceNo}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Received:</span>
                      <span className="font-semibold text-green-600">{grn.receivedQty}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Rejected:</span>
                      <span className="font-semibold text-red-600">{grn.rejectedQty}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">QC Status:</span>
                      <span
                        className={`font-bold text-xs ${grn.qcStatus === 'Completed' ? 'text-green-600' : 'text-yellow-600'
                          }`}
                      >
                        {grn.qcStatus}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleGRNOverview(grn)}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <FaEye className="w-4 h-4" />
                      View Details
                    </button>
                    <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                      <FaPrint className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Empty State */}
        {((activeTab === 'po' && filteredPOs.length === 0) ||
          (activeTab === 'grn' && filteredGRNs.length === 0)) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <FaBoxOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h5 className="text-xl font-semibold text-gray-700 mb-2">No records found</h5>
              <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          )}

        {/* PO Overview Modal */}
        {showPOOverview && selectedPO && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto my-8">
              <div className="sticky top-0 bg-blue-600 text-white px-4 sm:px-6 py-4 flex justify-between items-center rounded-t-xl">
                <h5 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <FaFileInvoice />
                  Purchase Order Overview: {selectedPO.orderNo}
                </h5>
                <button
                  onClick={() => {
                    setShowPOOverview(false)
                    setSelectedPO(null)
                  }}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* PO Details */}
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-blue-600 text-white px-4 py-3">
                      <h6 className="font-semibold text-sm">Purchase Order Details</h6>
                    </div>
                    <div className="p-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-700">Job Number:</span>
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                            {selectedPO.jobNo}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-700">PO Number:</span>
                          <span className="font-bold text-blue-600">{selectedPO.orderNo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-700">Date:</span>
                          <span className="text-gray-900">{selectedPO.date}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-700">Vendor:</span>
                          <span className="text-gray-900">{selectedPO.vendor}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-700">Status:</span>
                          <span
                            className={`font-bold text-xs ${selectedPO.status === 'Completed'
                                ? 'text-green-600'
                                : selectedPO.status === 'Pending'
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                              }`}
                          >
                            {selectedPO.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Document Details */}
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-blue-600 text-white px-4 py-3">
                      <h6 className="font-semibold text-sm">Document Details</h6>
                    </div>
                    <div className="p-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-700">Invoice No:</span>
                          <span className="font-bold text-gray-900">{selectedPO.invoiceNo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-700">Challan No:</span>
                          <span className="text-gray-900">{selectedPO.challanNo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-700">MIN No:</span>
                          <span className="text-gray-900">{selectedPO.mimNo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-700">QC Status:</span>
                          <span
                            className={`font-bold text-xs ${selectedPO.qcStatus === 'Completed'
                                ? 'text-green-600'
                                : 'text-yellow-600'
                              }`}
                          >
                            {selectedPO.qcStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quantity Summary */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4">
                  <div className="bg-green-600 text-white px-4 py-3">
                    <h6 className="font-semibold text-sm">Quantity Summary</h6>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div className="border-2 border-blue-500 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedPO.totalQty}
                        </div>
                        <div className="text-xs text-gray-500">Total Ordered</div>
                      </div>
                      <div className="border-2 border-green-500 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {selectedPO.receivedQty}
                        </div>
                        <div className="text-xs text-gray-500">Received</div>
                      </div>
                      <div className="border-2 border-yellow-500 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {selectedPO.pendingQty}
                        </div>
                        <div className="text-xs text-gray-500">Pending</div>
                      </div>
                    </div>
                    <div>
                      <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                        <div
                          className="h-full bg-green-600 flex items-center justify-center text-sm font-semibold text-white"
                          style={{
                            width: `${selectedPO.totalQty ? (selectedPO.receivedQty / selectedPO.totalQty) * 100 : 0}%`,
                          }}
                        >
                          {selectedPO.totalQty
                            ? ((selectedPO.receivedQty / selectedPO.totalQty) * 100).toFixed(1)
                            : 0}
                          %
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 text-center mt-2">
                        Receipt Progress
                      </div>
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-yellow-100 px-4 py-3">
                    <h6 className="font-semibold text-sm text-gray-900">Remarks</h6>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-700">Good Quality</p>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 sm:px-6 py-4 flex flex-wrap gap-3 justify-end rounded-b-xl">
                <button
                  onClick={() => {
                    setShowPOOverview(false)
                    setSelectedPO(null)
                  }}
                  className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg transition-colors"
                >
                  Close
                </button>
                <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
                  <FaPrint />
                  Print PO
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GRN Overview Modal */}
        {showGRNOverview && selectedGRN && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto my-8">
              <div className="sticky top-0 bg-green-600 text-white px-4 sm:px-6 py-4 flex justify-between items-center rounded-t-xl">
                <h5 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <FaClipboardCheck />
                  GRN Overview: {selectedGRN.grnNo}
                </h5>
                <button
                  onClick={() => {
                    setShowGRNOverview(false)
                    setSelectedGRN(null)
                  }}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* GRN Details */}
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-green-600 text-white px-4 py-3">
                      <h6 className="font-semibold text-sm">GRN Details</h6>
                    </div>
                    <div className="p-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-700">Job Number:</span>
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                            {selectedGRN.jobNo}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-700">GRN Number:</span>
                          <span className="font-bold text-green-600">{selectedGRN.grnNo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-700">Date:</span>
                          <span className="text-gray-900">{selectedGRN.date}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-700">PO Number:</span>
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                            {selectedGRN.poNo}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-700">Vendor:</span>
                          <span className="text-gray-900">{selectedGRN.vendor}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Document Details */}
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-blue-600 text-white px-4 py-3">
                      <h6 className="font-semibold text-sm">Document Details</h6>
                    </div>
                    <div className="p-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-700">Invoice No:</span>
                          <span className="font-bold text-gray-900">{selectedGRN.invoiceNo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-700">Challan No:</span>
                          <span className="text-gray-900">{selectedGRN.challanNo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-700">MIN No:</span>
                          <span className="text-gray-900">{selectedGRN.mimNo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-700">QC Status:</span>
                          <span
                            className={`font-bold text-xs ${selectedGRN.qcStatus === 'Completed'
                                ? 'text-green-600'
                                : 'text-yellow-600'
                              }`}
                          >
                            {selectedGRN.qcStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quantity Summary */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4">
                  <div className="bg-cyan-500 text-white px-4 py-3">
                    <h6 className="font-semibold text-sm">Quantity Summary</h6>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="border-2 border-green-500 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {selectedGRN.receivedQty}
                        </div>
                        <div className="text-xs text-gray-500">Received Qty</div>
                      </div>
                      <div className="border-2 border-red-500 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {selectedGRN.rejectedQty}
                        </div>
                        <div className="text-xs text-gray-500">Rejected Qty</div>
                      </div>
                      <div className="border-2 border-blue-500 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedGRN.receivedQty - selectedGRN.rejectedQty}
                        </div>
                        <div className="text-xs text-gray-500">Accepted Qty</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                {selectedGRN.remarks && (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-800 text-white px-4 py-3">
                      <h6 className="font-semibold text-sm">Remarks</h6>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-gray-700">{selectedGRN.remarks}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 sm:px-6 py-4 flex flex-wrap gap-3 justify-end rounded-b-xl">
                <button
                  onClick={() => {
                    setShowGRNOverview(false)
                    setSelectedGRN(null)
                  }}
                  className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg transition-colors"
                >
                  Close
                </button>
                <button className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
                  <FaPrint />
                  Print GRN
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default POGRNStatusList