import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

import { useLoader } from "../../context/LoaderContext";
import { decodeJwt } from "../../utils/helper/jwtHelper";
import { useMediaQuery, useTheme } from "@mui/material";
import TabCard from "../components/TabCard";
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

const AccountsList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showLoader, hideLoader } = useLoader();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { sampleSalesOrders, sampleSalesOrderCounts, filters, pagination } = useSelector(
    (state) => state.sampleSalesOrders
  );

  const [sampleType, setSampleType] = useState("");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [userRole, setUserRole] = useState("");

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);

  const [ready, setReady] = useState(false);

  const handleTypeChange = (type) => {
    const value = type === "all" ? "" : type;
    setSampleType(value);
    dispatch(setPagination({ page: 1 }));
  };

  const getCurrentType = () => {
    if (sampleType === "") return "all";
    return sampleType;
  };

  const getPendingPIValue = (type, counts) => {
    switch (type) {
      case "production":
        return counts?.prod_requestedAccountsFiles;
      case "sample":
        return counts?.sample_requestedAccountsFiles;
      default:
        return counts?.all_requestedAccountsFiles;
    }
  };

  const tabs = [
    { label: `Pending PI Uploads (${getPendingPIValue(sampleType, sampleSalesOrderCounts)})`, value: "requestedaccountsfiles" },
    // { label: "Completed", value: "completed" },
  ];

  useEffect(() => {
    dispatch(resetFilters());
    dispatch(setPagination({ page: 1, limit: 8 }));
    dispatch(setFilters({ status: "requestedaccountsfiles" }));
    setReady(true);
  }, [dispatch]);

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
      ...(sampleType ? { type: sampleType } : {}),
    };

    dispatch(fetchAllSampleOrders(payload))
      .unwrap()
      .finally(() => hideLoader());
  }, [dispatch, ready, pagination.page, pagination.limit, filters.status, filters.search, sampleType, showLoader, hideLoader]);

  useEffect(() => {
    dispatch(fetchSampleSalesOrderCounts("accounts"));
  }, [dispatch]);

  const refetchAccounts = () => {
    const payload = {
      page: pagination.page,
      limit: pagination.limit,
      search: filters.search,
      status: filters.status,
      ...(sampleType ? { type: sampleType } : {}),
    };

    dispatch(fetchAllSampleOrders(payload));
    dispatch(fetchSampleSalesOrderCounts("accounts"));
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

      refetchAccounts();
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

  const handleTabChange = (event, newValue) => {
    dispatch(setFilters({ status: newValue }));
    dispatch(setPagination({ page: 1 }));
    setSampleType("");
  };

  return (
    <>
      <h2 className="text-2xl font-bold mb-4 mt-5 px-3">Accounts PI List</h2>
      {/* Search */}
      <div className="bg-white p-4 shadow-sm mb-6 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              placeholder="Search by product, client, job number..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-800"
              value={filters.search}
              onChange={(e) => {
                dispatch(setFilters({ search: e.target.value }));
                dispatch(setPagination({ page: 1 }));
              }}
            />
            <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>
          <div className="flex justify-center">
            <div className="inline-flex bg-gray-100 rounded-full shadow-sm border border-gray-200 p-1">
              <button
                onClick={() => handleTypeChange("all")}
                className={`
                  px-5 py-2 text-xs font-bold uppercase tracking-wide
                  rounded-full transition-all duration-200
                  ${getCurrentType() === "all"
                    ? "bg-gray-800 text-white shadow-md"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
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
                  ${getCurrentType() === "production"
                    ? "bg-gray-800 text-white shadow-md"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
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
                  ${getCurrentType() === "sample"
                    ? "bg-gray-800 text-white shadow-md"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }
                `}
              >
                Sample
              </button>
            </div>
          </div>
          <div className="hidden lg:block"></div>
        </div>
      </div>

      {/* <Tabs
        value={filters.status}
        onChange={(event, newValue) => {
          dispatch(setFilters({ status: newValue }));
          dispatch(setPagination({ page: 1 }));

        }}
        variant="scrollable"
        scrollButtons="auto"
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
        {tabs.map((tab) => (
          <Tab key={tab.value} label={tab.label} value={tab.value} />
        ))}
      </Tabs>
      
      <div className="flex justify-end w-full mb-2">
        <FormControl size="small" className="w-40">
          <Select
            value={sampleType}
            onChange={(e) => {
              setSampleType(e.target.value);
              dispatch(setPagination({ page: 1 }));
            }}
            displayEmpty
          >
            <MenuItem value="">
              <span className="text-gray-500">All</span>
            </MenuItem>
            <MenuItem value="sample">Sample</MenuItem>
            <MenuItem value="production">Production</MenuItem>
          </Select>
        </FormControl>
      </div> */}

      {/* Tabs */}
      {isMobile ? (
        <FormControl fullWidth sx={{ mb: 2, px: 2 }}>
          <Select
            value={filters.status}
            onChange={(e) => handleTabChange(null, e.target.value)}
            displayEmpty
          >
            {tabs.map((tab) => (
              <MenuItem key={tab.value} value={tab.value}>
                {tab.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : (
        <TabCard
          tabs={tabs}
          activeValue={filters.status}
          onChange={(value) => handleTabChange(null, value)}
        />
      )}

      <div className="px-4 mb-8">
        {sampleSalesOrders.length === 0 ? (
          <p className="text-center text-gray-500">No data found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sampleSalesOrders.map((sampleOrder) => (
              <SampleorderCard
                key={sampleOrder.id}
                sampleOrder={sampleOrder}
                navigate={navigate}
                Enquirysmoduleonly={true}
                requestedaccountsfiles={true}
                handleUpdatepifiles={handleUpdatepifiles}
                onView={handleViewOrder}
                Accountpageonly={true}
                fetchSampleorders={refetchAccounts}
              />
            ))}
          </div>
        )}
      </div>

      {viewModalOpen && viewOrder && (
        <AccountsViewModel
          order={viewOrder}
          onClose={() => setViewModalOpen(false)}
        />
      )}

      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        itemsPerPage={pagination.limit}
        totalCount={pagination.total}

        startIndex={(pagination.page - 1) * pagination.limit}
        visibleItemCount={sampleSalesOrders.length}

        onPageChange={(newPage) =>
          dispatch(setPagination({ page: newPage }))
        }

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
    </>
  );
};

export default AccountsList;
