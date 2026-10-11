import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import TabCard from "../../components/TabCard";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import {
  fetchAllSampleOrders,
  fetchSampleSalesOrderCounts,
  setFilters,
  setPagination,
  resetFilters,
  clearSampleOrders,
  fetchproductionTeam,
} from "../../../reducer/sampleSalesorderReducer";
import { useMediaQuery, useTheme } from "@mui/material";
import SampleorderCard from "../components/sampleordercard";
import { useLoader } from "../../../context/LoaderContext";
import Pagination from "../../components/Pagination";
import { useAuthData } from "../../../utils/hooks/useAuthData";
import { getpricingspecialist } from "../../../utils/permission/auth";

const OrdersList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { showLoader, hideLoader } = useLoader();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const {
    sampleSalesOrders,
    sampleSalesOrderCounts,
    loading,
    pagination,
    filters,
    Productionteammembers,
  } = useSelector((state) => state.sampleSalesOrders);

  // Get order type from query parameter (default to 'all')
  const orderTypeFromQuery = searchParams.get("type") || "all";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visibleTabs, setVisibleTabs] = useState([
    "",
    "pending",
    "process",
    "complete",
  ]);
  const [ready, setReady] = useState(false);
  const [countTrigger, setCountTrigger] = useState(0);

  const { isHead, userRole, permissions, ProductionRole, userId } = useAuthData();

  const prouductionmember = userRole?.toLowerCase() === "admin executive" || (ProductionRole && isHead);

  // Function to get count based on current order type and status
  const getTabCount = (status) => {
    const typePrefix = orderTypeFromQuery === "all" ? "all" :
      orderTypeFromQuery === "production" ? "prod" : "sample";
    const statusSuffix = status === "" ? "all" : status;
    const key = `${typePrefix}_${statusSuffix}`;
    return sampleSalesOrderCounts?.[key] || 0;
  };

  const tabs = [
    { label: `ALL (${getTabCount("")})`, value: "" },
    { label: `PENDING (${getTabCount("pending")})`, value: "pending" },
    { label: `PROCESS (${getTabCount("process")})`, value: "process" },
    { label: `COMPLETED (${getTabCount("complete")})`, value: "complete" },
  ];

  const showQuotationHub = getpricingspecialist();
  const showProductionHub = true; // production always exists

  const showOnlyProduction = showProductionHub && !showQuotationHub;

  // Fetch production team on mount
  useEffect(() => {
    dispatch(fetchproductionTeam());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchSampleSalesOrderCounts("production"));
  }, [dispatch, orderTypeFromQuery, filters.status, countTrigger]);

  const triggerCountRefresh = () => {
    setCountTrigger((prev) => prev + 1);
  };

  // Reset on mount or when order type changes
  useEffect(() => {
    dispatch(clearSampleOrders());
    dispatch(resetFilters());
    dispatch(setPagination({ page: 1, limit: 8 }));
    setReady(true);
  }, [dispatch, orderTypeFromQuery]);

  // Fetch orders based on type and filters
  useEffect(() => {
    if (!ready) return;

    const loadOrders = async () => {
      showLoader();
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          search: filters.search,
          status: filters.status,
        };

        // Add type parameter based on query
        if (orderTypeFromQuery === "production") {
          params.type = "production";
          params.category = "Production";
        } else if (orderTypeFromQuery === "sample") {
          params.type = "sample";
          params.category = "Sample";
        } else if (orderTypeFromQuery === "all") {
          // Fetch all types - no type filter
          params.type = ""; // or handle differently based on your API
        }

        await dispatch(fetchAllSampleOrders(params)).unwrap();
      } catch (err) {
        console.error(err);
      } finally {
        hideLoader();
      }
    };

    loadOrders();
  }, [
    dispatch,
    ready,
    pagination.page,
    pagination.limit,
    filters.search,
    filters.status,
    orderTypeFromQuery,
    showLoader,
    hideLoader,
  ]);

  const handleSearch = (e) => {
    dispatch(setFilters({ search: e.target.value }));
    dispatch(setPagination({ page: 1 }));
  };

  const handleTabChange = (value) => {
    dispatch(setFilters({ status: value }));
    dispatch(setPagination({ page: 1 }));
    triggerCountRefresh();
  };

  const handleTypeChange = (type) => {
    // Update URL query parameter
    setSearchParams({ type });
    dispatch(setPagination({ page: 1 }));
    triggerCountRefresh();
  };

  const handleHubSwitch = (hub) => {
    if (hub === "quotation") {
      navigate("/quotation");
    }
  };

  // Get display title based on type
  const getPageTitle = () => {
    if (orderTypeFromQuery === "production") return "Production Orders";
    if (orderTypeFromQuery === "sample") return "Sample Orders";
    return "All Orders";
  };

  return (
    <>
      {/* <h2 className="text-2xl font-bold mb-4 mt-12 px-4">Production Floor - {getPageTitle()}</h2> */}

      {/* Hub Switcher */}
      <div className="px-4 mb-6 mt-5">
        <div
          className={`
            grid gap-4 pb-6 border-b border-gray-200
            ${showOnlyProduction ? "grid-cols-1 justify-items-center" : "grid-cols-1 md:grid-cols-2"}
          `}
        >
          {/* Quotation Hub */}
          {showQuotationHub && (
            <div
              onClick={() => handleHubSwitch("quotation")}
              className={`
              flex items-center justify-center gap-3 p-6 rounded-xl cursor-pointer
              transition-all duration-200 border-2
              bg-white border-gray-200 shadow-sm hover:shadow-md hover:border-teal-400
            `}
            >
              <div className="text-3xl">📑</div>
              <div>
                <div className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">
                  HUB 1
                </div>
                <h3 className="text-xl font-bold text-gray-600">
                  QUOTATION DESK
                </h3>
              </div>
            </div>
          )}

          {/* Production Hub - Active */}
          <div
            className={`
              flex items-center justify-center gap-3 p-6 rounded-xl
             ${showOnlyProduction
                ? "" // calm, centered, no focus
                : "bg-purple-50 border-2 border-purple-500 shadow-lg"
              }
            `}
          >
            <div className="text-3xl">🏭</div>
            <div>
              {showQuotationHub && (
                <div className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">
                  HUB 2
                </div>
              )}

              <h3 className="text-xl font-bold text-purple-600">
                PRODUCTION FLOOR
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Search, Filter, and Manage Tabs in Same Row */}
      <div className="bg-white p-4 shadow-sm mb-6 mx-4 rounded-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Search Bar */}
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              placeholder="Search by job number or reference no..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              value={filters.search}
              onChange={handleSearch}
            />
            <i
              className="fa-solid fa-search absolute left-3 top-1/2 transform 
              -translate-y-1/2 text-gray-400"
            ></i>
          </div>

          <div className="w-full lg:w-auto flex justify-center">
            {/* Filter Type Switcher */}
            <div className="inline-flex bg-gray-100 rounded-full shadow-sm border border-gray-200">
              <button
                onClick={() => handleTypeChange("all")}
                className={`
                  px-5 py-2 text-xs font-bold uppercase tracking-wide
                  rounded-full transition-all duration-200
                  ${orderTypeFromQuery === "all"
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
                  ${orderTypeFromQuery === "production"
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
                  ${orderTypeFromQuery === "sample"
                    ? "bg-gray-800 text-white"
                    : "text-gray-500 hover:text-gray-700"
                  }
                `}
              >
                Sample
              </button>
            </div>
          </div>

          {/* Manage Tabs Button */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
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

      {/* Simple Tabs */}
      {/* <div className="px-4 mb-6">
        <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
          {tabs
            .filter((tab) => visibleTabs.includes(tab.value))
            .map((tab) => {
              const isActive = (filters.status || "") === tab.value;

              return (
                <button
                  key={tab.value}
                  onClick={() => handleTabChange(tab.value)}
                  className={`
                    px-6 py-3 text-sm font-semibold uppercase tracking-wide
                    transition-all duration-200 border-b-2 whitespace-nowrap
                    ${isActive
                      ? "border-gray-800 text-gray-800 bg-gray-100"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }
                  `}
                >
                  {tab.label}
                </button>
              );
            })}
        </div>
      </div> */}

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
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="text-gray-500 mt-4">Loading...</p>
          </div>
        ) : sampleSalesOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 text-lg">No orders found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
            {sampleSalesOrders
              // .filter(order => {
              //   if (!order.is_on_hold) return true;
              //   if (userRole.toLowerCase().includes("admin") || (isHead && ProductionRole)) return true;
              //   const lastHold = order.hold_history?.[order.hold_history.length - 1];
              //   return lastHold?.hold_by === userId;
              // })
              .map((sampleOrder) => (
                <SampleorderCard
                  key={sampleOrder.id}
                  sampleOrder={sampleOrder}
                  navigate={navigate}
                  isProductionHub={true}
                  isProductionComplete={filters.status === "complete"}
                  showdesignerfiles={true}
                  prouductionmember={prouductionmember}
                  fetchSampleorders={() => {
                    dispatch(
                      fetchAllSampleOrders({
                        page: pagination.page,
                        limit: pagination.limit,
                        search: filters.search,
                        status: filters.status,
                        type:
                          orderTypeFromQuery === "all"
                            ? ""
                            : orderTypeFromQuery,
                        ...(orderTypeFromQuery !== "all" && {
                          category:
                            orderTypeFromQuery === "production"
                              ? "Production"
                              : "Sample",
                        }),
                      }),
                    )
                    triggerCountRefresh();
                  }}
                />
              ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        itemsPerPage={pagination.limit}
        totalCount={pagination.total}
        startIndex={(pagination.page - 1) * pagination.limit}
        visibleItemCount={sampleSalesOrders.length}
        //   .filter(order => {
        //   if (!order.is_on_hold) return true;
        //   if (userRole.toLowerCase().includes("admin") || (isHead && ProductionRole)) return true;
        //   const lastHold = order.hold_history?.[order.hold_history.length - 1];
        //   return lastHold?.hold_by === userId;
        // }).length}
        onPageChange={(newPage) => dispatch(setPagination({ page: newPage }))}
        onItemsPerPageChange={(newLimit) =>
          dispatch(setPagination({ limit: newLimit, page: 1 }))
        }
      />

      {/* Tab Management Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 shadow-xl">
            <h3 className="text-lg font-bold mb-4">Select Tabs to Display</h3>

            {tabs.map((tab) => (
              <label
                key={tab.value}
                className="flex items-center mb-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
              >
                <input
                  type="checkbox"
                  checked={visibleTabs.includes(tab.value)}
                  onChange={() => {
                    if (visibleTabs.includes(tab.value)) {
                      setVisibleTabs(
                        visibleTabs.filter((v) => v !== tab.value),
                      );
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
                  setVisibleTabs(["", "pending", "process", "complete"]);
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

export default OrdersList;
