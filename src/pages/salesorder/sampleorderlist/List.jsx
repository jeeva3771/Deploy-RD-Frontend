import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchAllSampleOrders,
  setFilters,
  setPagination,
  resetFilters,
  clearSampleOrders,
} from "../../../reducer/sampleSalesorderReducer";

import SampleorderCard from "../components/sampleordercard";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { useLoader } from "../../../context/LoaderContext";
import Pagination from "../../components/Pagination";
import { getUserPermissions } from "../../../utils/permission/auth";
import { useAuthData } from "../../../utils/hooks/useAuthData";

const SampleorderList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showLoader, hideLoader } = useLoader();

  const { sampleSalesOrders, loading, pagination, filters, Productionteammembers } = useSelector(
    (state) => state.sampleSalesOrders
  );

  // console.log("Productionteammembers",Productionteammembers)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visibleTabs, setVisibleTabs] = useState([
    "",
    "pending",
    "process",
    "complete",
  ]);

  const [ready, setReady] = useState(false);


  const { isHead,
    userRole,
    permissions,
    ProductionRole } = useAuthData();


  //     console.log("isHead:", isHead);
  // console.log("userRole:", userRole);
  // console.log("permissions:", permissions);
  // console.log("ProductionRole:", ProductionRole);

  const prouductionmember = userRole?.toLowerCase() === "admin executive" || (ProductionRole && isHead);



  const tabs = [
    { label: "All", value: "" },
    { label: "Pending", value: "pending" },
    { label: "Process", value: "process" },
    { label: "Completed", value: "complete" },
  ];

  useEffect(() => {
    dispatch(resetFilters());
    dispatch(setPagination({ page: 1, limit: 8 }));
    setReady(true);

  }, [dispatch]);




  useEffect(() => {
    const loadSampleOrders = async () => {
      if (!ready) return;

      showLoader();
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          search: filters.search,
          status: filters.status,
          type: "sample"
        };

        await dispatch(fetchAllSampleOrders(params)).unwrap();
      } catch (err) {
        console.error(err);
      } finally {
        hideLoader();
      }
    };

    loadSampleOrders();
  }, [
    dispatch,
    ready,
    pagination.page,
    pagination.limit,
    filters.search,
    filters.status,
    showLoader,
    hideLoader,
  ]);

  const handleSearch = (e) => {
    dispatch(setFilters({ search: e.target.value }));
    dispatch(setPagination({ page: 1 }));
  };

  const handleTabChange = (event, newValue) => {
    dispatch(setFilters({ status: newValue }));
    dispatch(setPagination({ page: 1 }));
  };


  return (
    <>
      <h2 className="text-2xl font-bold mb-4 mt-2 px-4">Sample Orders List</h2>

      <div className="bg-white p-4 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">

          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              placeholder="Search by job number..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-blue-500 
                dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              value={filters.search}
              onChange={handleSearch}
            />
            <i className="fa-solid fa-search absolute left-3 top-1/2 transform 
              -translate-y-1/2 text-gray-400"></i>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
            style={{ backgroundColor: "#574fdd" }}
          >
            Manage Tabs
          </button>
        </div>
      </div>

      <Tabs
        value={filters.status || ""}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="Status filter tabs"
        sx={{
          mb: 2,
          px: 2,
          color: "gray",
          "& .MuiTab-root": {
            color: "gray",
          },
          "& .Mui-selected": {
            backgroundColor: "#c3c3d3ff",
            color: "#747373ff !important",
            fontWeight: "bold",
          },
        }}
      >
        {tabs
          .filter((tab) => visibleTabs.includes(tab.value))
          .map((tab) => (
            <Tab key={tab.value} label={tab.label} value={tab.value} />
          ))}
      </Tabs>

      <div className={`px-4 mb-8 transition-opacity duration-200 ${loading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
        {sampleSalesOrders.length === 0 && !loading ? (
          <p className="text-center text-gray-500 py-8">No sample orders found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
            {sampleSalesOrders.map((sampleOrder) => (
              <SampleorderCard
                key={sampleOrder.id}
                sampleOrder={sampleOrder}
                navigate={navigate}
                showdesignerfiles={true}
                prouductionmember={prouductionmember}
                fetchSampleorders={() =>
                  dispatch(
                    fetchAllSampleOrders({
                      page: pagination.page,
                      limit: pagination.limit,
                      search: filters.search,
                      status: filters.status,
                      type: "sample"
                    })
                  )
                }
              />
            ))}
          </div>
        )}
      </div>

      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        itemsPerPage={pagination.limit}
        totalCount={pagination.total}
        startIndex={(pagination.page - 1) * pagination.limit}
        visibleItemCount={sampleSalesOrders.length}
        onPageChange={(newPage) => dispatch(setPagination({ page: newPage }))}
        onItemsPerPageChange={(newLimit) =>
          dispatch(setPagination({ limit: newLimit, page: 1 }))
        }
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 shadow-xl">
            <h3 className="text-lg font-bold mb-4">Select Tabs to Display</h3>

            {tabs.map((tab) => (
              <label key={tab.value} className="flex items-center mb-2">
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
                  className="mr-2"
                />
                {tab.label}
              </label>
            ))}

            <div className="flex justify-between mt-4">
              <button
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </button>

              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
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

export default SampleorderList;
