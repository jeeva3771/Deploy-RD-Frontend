import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useLoader } from "../../context/LoaderContext";
import { decodeJwt } from "../../utils/helper/jwtHelper";
import TabCard from "../components/TabCard";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import {
  fetchAllSampleOrders,
  fetchSampleSalesOrderCounts,
  updateSampleOrderById,
  setFilters,
  setPagination,
  resetFilters,
  clearSampleOrders,
} from "../../reducer/sampleSalesorderReducer";
import SampleorderCard from "../salesorder/components/sampleordercard";
import DesignerFileUploadModal from "../salesorder/components/DesignerFileUploadModal";
import Pagination from "../components/Pagination";
import AccountsViewModel from "../salesorder/components/AccountsScreenViewModel";
import QuotationViewModel from "../salesorder/components/QuoatationScreenViewModel";
import { useAuthData } from "../../utils/hooks/useAuthData";
import { useMediaQuery, useTheme } from "@mui/material";

const QuotationList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { showLoader, hideLoader } = useLoader();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { sampleSalesOrders, sampleSalesOrderCounts, filters, pagination } = useSelector(
    (state) => state.sampleSalesOrders
  );
  const [countTrigger, setCountTrigger] = useState(0);
  // Get type from query parameter (all, sample, production)
  const typeFromQuery = searchParams.get("type") || "all";

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [userRole, setUserRole] = useState("");

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);

  const [ready, setReady] = useState(false);

  const [viewQuoatationModalOpen, setViewQuoatationModalOpen] = useState(false);
  const [viewQuoatationOrder, setViewQuoatationOrder] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visibleTabs, setVisibleTabs] = useState([
    "quotation_all",
    "requestedquotaion",
    "newbom",
    "bomdraft",
    "bomrework",
    "approvedquotation",
    "completedandverified",
  ]);

  const getTabCount = (status) => {
    const typePrefix = typeFromQuery === "all" ? "all" :
      typeFromQuery === "production" ? "prod" : "sample";
    const key = `${typePrefix}_${status}`;
    return sampleSalesOrderCounts?.[key] || 0;
  };

  const getAllQuotationTabCount = () => {
    const apiCount = getTabCount("quotation_all");
    if (apiCount > 0) return apiCount;
    return (
      getTabCount("requestedquotaion") +
      getTabCount("newbom") +
      getTabCount("bomdraft") +
      getTabCount("bomrework") +
      getTabCount("approvedquotation") +
      getTabCount("completedandverified")
    );
  };

  const triggerCountRefresh = () => {
    setCountTrigger((prev) => prev + 1);
  };

  const tabs = [
    { label: `ALL (${getAllQuotationTabCount()})`, value: "quotation_all" },
    { label: `NEW (${getTabCount("newbom")})`, value: "newbom" },
    { label: `DRAFT (${getTabCount("bomdraft")})`, value: "bomdraft" },
    { label: `REWORK (${getTabCount("bomrework")})`, value: "bomrework" },
    { label: `COMPLETED AWAITING (${getTabCount("approvedquotation")})`, value: "approvedquotation" },
    { label: `COMPLETED & PROCESSED (${getTabCount("completedandverified")})`, value: "completedandverified" },
  ];

  useEffect(() => {
    dispatch(resetFilters());
    dispatch(setPagination({ page: 1, limit: 8 }));
    dispatch(setFilters({ status: "quotation_all" }));
    setReady(true);
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchSampleSalesOrderCounts("quotation"));
  }, [dispatch, typeFromQuery, filters.status, countTrigger]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    const decoded = decodeJwt(token);
    if (!decoded) return navigate("/login");

    setUserRole(decoded.role || "");
  }, [navigate]);

  useEffect(() => {
    if (!filters.status) return;
    if (!ready) return;

    showLoader();

    const payload = {
      page: pagination.page,
      limit: pagination.limit,
      search: filters.search,
      status: filters.status,
    };

    // Add type filter based on query parameter
    if (typeFromQuery !== "all") {
      payload.type = typeFromQuery;
    }

    dispatch(fetchAllSampleOrders(payload))
      .unwrap()
      .finally(() => hideLoader());
  }, [dispatch, ready, pagination.page, pagination.limit, filters.status, filters.search, typeFromQuery, showLoader, hideLoader]);

  const refetchQuotations = () => {
    const payload = {
      page: pagination.page,
      limit: pagination.limit,
      status: filters.status,
    };

    if (typeFromQuery !== "all") {
      payload.type = typeFromQuery;
    }

    dispatch(fetchAllSampleOrders(payload));
    triggerCountRefresh();
  };

  const handleUpdatepifiles = (id) => {
    setSelectedOrderId(id);
    setUploadModalOpen(true);
  };

  const handleFileChange = (e) => {
    setUploadFiles([...uploadFiles, ...Array.from(e.target.files)]);
  };

  const removeUploadedFile = (i) => {
    setUploadFiles(uploadFiles.filter((_, idx) => idx !== i));
  };

  const uploadFilesSubmit = async () => {
    if (!uploadFiles.length) return toast.error("Please select at least one file.");

    try {
      setUploadLoading(true);
      const formData = new FormData();
      uploadFiles.forEach((file) => formData.append("pi_files", file));
      formData.append("is_pi_uploaded", true);
      formData.append("is_pi_rework", true);

      await dispatch(updateSampleOrderById({ id: selectedOrderId, formData })).unwrap();

      toast.success("Files uploaded successfully");
      setUploadModalOpen(false);
      setUploadFiles([]);

      refetchQuotations();
    } catch (err) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleViewOrder = (order) => {
    setViewOrder(order);
    setViewModalOpen(true);
  };

  const handleViewQuoatationOrder = (order) => {
    setViewQuoatationOrder(order);
    setViewQuoatationModalOpen(true);
  };

  const handleHubSwitch = (hub) => {
    if (hub === "production") {
      navigate("/productionorder");
    }
  };

  const handleTypeChange = (type) => {
    setSearchParams({ type });
    dispatch(setPagination({ page: 1 }));
    triggerCountRefresh();
  };

  const handleTabChange = (value) => {
    dispatch(setFilters({ status: value }));
    dispatch(setPagination({ page: 1 }));
    triggerCountRefresh();
  };

  const { isHead, ProductionRole } = useAuthData();

  const prouductionmember = userRole?.toLowerCase() === "admin executive" || (ProductionRole && isHead);

  const Viewonlybom =
    filters.status === "approvedquotation" || filters.status === "completedandverified";

  return (
    <>
      {/* <h2 className="text-2xl font-bold mb-4 mt-12 px-4">Quotation Desk</h2> */}

      {/* Hub Switcher */}
      <div className="px-4 mb-6 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-gray-200">
          {/* Quotation Hub - Active */}
          <div
            className={`
              flex items-center justify-center gap-3 p-6 rounded-xl
              transition-all duration-200 border-2
              bg-teal-50 border-teal-500 shadow-lg
            `}
          >
            <div className="text-3xl">📑</div>
            <div>
              <div className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">
                HUB 1
              </div>
              <h3 className="text-xl font-bold text-teal-600">QUOTATION DESK</h3>
            </div>
          </div>

          {/* Production Hub */}
          <div
            onClick={() => handleHubSwitch("production")}
            className={`
              flex items-center justify-center gap-3 p-6 rounded-xl cursor-pointer
              transition-all duration-200 border-2
              bg-white border-gray-200 shadow-sm hover:shadow-md hover:border-purple-400
            `}
          >
            <div className="text-3xl">🏭</div>
            <div>
              <div className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">
                HUB 2
              </div>
              <h3 className="text-xl font-bold text-gray-600">PRODUCTION FLOOR</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Search, Type Filter, and Manage Tabs in Same Row */}
      <div className="bg-white p-4 shadow-sm mb-6 mx-4 rounded-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Search Bar */}
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              placeholder="Search by job number..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.search}
              onChange={(e) => {
                dispatch(setFilters({ search: e.target.value }));
                dispatch(setPagination({ page: 1 }));
              }}
            />
            <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>

          <div className="w-full lg:w-auto flex justify-center">
            {/* Type Filter Switcher */}
            <div className="inline-flex bg-gray-100 rounded-full shadow-sm border border-gray-200">
              <button
                onClick={() => handleTypeChange("all")}
                className={`
                  px-5 py-2 text-xs font-bold uppercase tracking-wide
                  rounded-full transition-all duration-200
                  ${typeFromQuery === "all"
                    ? "bg-gray-800 text-white"
                    : "text-gray-500 hover:text-gray-700"
                  }
                `}
              >
                All
              </button>
              <button
                onClick={() => handleTypeChange("production")}
                className={`
                  px-5 py-2 text-xs font-bold uppercase tracking-wide
                  rounded-full transition-all duration-200
                  ${typeFromQuery === "production"
                    ? "bg-gray-800 text-white"
                    : "text-gray-500 hover:text-gray-700"
                  }
                `}
              >
                Production
              </button>
              <button
                onClick={() => handleTypeChange("sample")}
                className={`
                  px-5 py-2 text-xs font-bold uppercase tracking-wide
                  rounded-full transition-all duration-200
                  ${typeFromQuery === "sample"
                    ? "bg-gray-800 text-white"
                    : "text-gray-500 hover:text-gray-700"
                  }
                `}
              >
                Sample
              </button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {/* Manage Tabs Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition
                whitespace-nowrap"
              style={{ backgroundColor: "#574fdd" }}
            >
              Manage Tabs
            </button>
          </div>
        </div>
      </div>
      {isMobile ? (
        <FormControl fullWidth sx={{ mb: 2, px: 2 }}>
          <Select
            value={filters.status}
            onChange={(e) => handleTabChange(e.target.value)}
            displayEmpty
          >
            {tabs
              .filter((tab) => visibleTabs.includes(tab.value))
              .map((tab) => (
                <MenuItem key={tab.value} value={tab.value}>
                  {tab.label}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      ) : (
        <div className="px-4 mb-6">
          <TabCard
            tabs={tabs.filter((tab) => visibleTabs.includes(tab.value))}
            activeValue={filters.status || ""}
            onChange={(value) => handleTabChange(value)}
          />
        </div>
      )}

      {/* Orders Grid */}
      <div className="px-4 mb-8">
        {sampleSalesOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 text-lg">No quotations found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
            {sampleSalesOrders.map((sampleOrder) => (
              <SampleorderCard
                key={sampleOrder.id}
                sampleOrder={sampleOrder}
                navigate={navigate}
                requestedquotaion={true}
                handleUpdatepifiles={handleUpdatepifiles}
                onView={handleViewOrder}
                onViewQuote={handleViewQuoatationOrder}
                Quotationpageonly={true}
                prouductionmember={prouductionmember}
                onAssignSuccess={refetchQuotations}
                Viewonlybom={Viewonlybom}
                fetchSampleorders={refetchQuotations}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {viewModalOpen && viewOrder && (
        <AccountsViewModel order={viewOrder} onClose={() => setViewModalOpen(false)} />
      )}

      {viewQuoatationModalOpen && viewQuoatationOrder && (
        <QuotationViewModel
          order={viewQuoatationOrder}
          onClose={() => setViewQuoatationModalOpen(false)}
        />
      )}

      {/* Pagination */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        itemsPerPage={pagination.limit}
        totalCount={pagination.total}
        startIndex={(pagination.page - 1) * pagination.limit}
        visibleItemCount={sampleSalesOrders.length}
        onPageChange={(newPage) => dispatch(setPagination({ page: newPage }))}
        onItemsPerPageChange={(newLimit) => {
          dispatch(setPagination({ limit: newLimit, page: 1 }));
        }}
      />

      {/* File Upload Modal */}
      <DesignerFileUploadModal
        open={uploadModalOpen}
        files={uploadFiles}
        onClose={() => setUploadModalOpen(false)}
        onFileChange={handleFileChange}
        onRemoveFile={removeUploadedFile}
        onSubmit={uploadFilesSubmit}
        loading={uploadLoading}
      />

      {/* Tab Management Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 shadow-xl">
            <h3 className="text-lg font-bold mb-4">Select Tabs to Display</h3>

            {tabs.map((tab) => (
              <label key={tab.value} className="flex items-center mb-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input
                  type="checkbox"
                  checked={visibleTabs.includes(tab.value)}
                  onChange={() => {
                    if (visibleTabs.includes(tab.value)) {
                      setVisibleTabs(visibleTabs.filter((v) => v !== tab.value));
                    } else {
                      setVisibleTabs([...visibleTabs, tab.value]);
                    }
                  }}
                  className="mr-3 w-4 h-4"
                />
                <span className="font-medium">{tab.label}</span>
              </label>
            ))}

            <div className="flex justify-between gap-3 mt-6 pt-4 border-t">
              <button
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </button>

              <button
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                onClick={() => {
                  setVisibleTabs(tabs.map((t) => t.value));
                }}
              >
                Show All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QuotationList;