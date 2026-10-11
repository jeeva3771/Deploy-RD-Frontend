import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import AddIcon from "@mui/icons-material/Add";
import { useLoader } from "../../context/LoaderContext";
import { decodeJwt } from "../../utils/helper/jwtHelper";
import TabCard from "../components/TabCard";
import {
  fetchAllBOMs,
  fetchAllStandaloneBOMsCounts,
  updateBOM,
  setFilters,
  setPagination,
  resetFilters,
} from "../../reducer/standalone_bomReducer";

import SampleorderCard from "../salesorder/components/sampleordercard";
import DesignerFileUploadModal from "../salesorder/components/DesignerFileUploadModal";
import Pagination from "../components/Pagination";
import AccountsViewModel from "../salesorder/components/AccountsScreenViewModel";
import QuotationViewModel from "../salesorder/components/QuoatationScreenViewModel";
import { useAuthData } from "../../utils/hooks/useAuthData";
import Standalonecard from "../salesorder/components/standalone_quotation_card";
import { useMediaQuery, useTheme } from "@mui/material";

const StandaloneQuotationList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showLoader, hideLoader } = useLoader();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { boms, standaloneBOMCounts, filters, pagination } = useSelector(
    (state) => state.standalonebom
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

  const [viewQuoatationModalOpen, setViewQuoatationModalOpen] = useState(false);
  const [viewQuoatationOrder, setViewQuoatationOrder] = useState(null);

  const tabs = [
    { label: `All (${standaloneBOMCounts?.requestedquotaion || 0})`, value: "requestedquotaion" },
    { label: `Draft (${standaloneBOMCounts?.drafts || 0})`, value: "draft" },
    // { label: "New", value: "newbom" },
    // { label: "Rework", value: "bomrework" },
    // { label: "Completed Awaiting Process", value: "approvedquotation" },
    // { label: "Completed & Processed", value: "completedandverified" },
  ];

  useEffect(() => {
    dispatch(resetFilters());
    dispatch(setPagination({ page: 1, limit: 8 }));
    dispatch(setFilters({ status: "requestedquotaion" }));
    setReady(true);
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchAllStandaloneBOMsCounts());
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

    dispatch(fetchAllBOMs(payload))
      .unwrap()
      .finally(() => hideLoader());
  }, [dispatch, ready, pagination.page, pagination.limit, filters.status, filters.search, sampleType, showLoader, hideLoader]);

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

      await dispatch(updateBOM({ id: selectedOrderId, formData })).unwrap();

      toast.success("Files uploaded successfully");
      setUploadModalOpen(false);
      setUploadFiles([]);

      dispatch(
        fetchAllBOMs({
          page: pagination.page,
          limit: pagination.limit,
          status: filters.status,
        })
      );
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


  const { isHead, ProductionRole } = useAuthData();

  const prouductionmember = userRole?.toLowerCase() === "admin executive" || (ProductionRole && isHead);

  const handleTabChange = (event, newValue) => {
    dispatch(setFilters({ status: newValue }));
    dispatch(setPagination({ page: 1 }));
  };

  const refetchQuotations = () => {
    dispatch(fetchAllBOMs({
      page: pagination.page,
      limit: pagination.limit,
      status: filters.status,
      ...(sampleType ? { type: sampleType } : {}),
    }));
  };

  // const Viewonlybom = filters.status === "approvedquotation" || filters.status === "completedandverified";


  return (
    <>
      <h2 className="text-2xl font-bold mb-4 mt-5 px-4">Standalone Quotation List</h2>

      {/* Search */}
      <div className="bg-white p-4 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              placeholder="Search by product, job number..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-800"
              value={filters.search}
              onChange={(e) => {
                dispatch(setFilters({ search: e.target.value }));
                dispatch(setPagination({ page: 1 }));
              }}
            />
            <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>
          {/* Replace the existing Tabs section with this */}


          {/* Add Quotation Button */}
          <div className="flex justify-end w-full mb-2 px-4">
            <button
              className="py-2 px-3 rounded-lg text-white text-sm font-medium transition flex items-center justify-center gap-2 shadow-sm hover:shadow"
              style={{ backgroundColor: "#7C3AED", cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#6D28D9")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#7C3AED")}
              onClick={() => navigate("/standalone/quotation/add")}
            >
              <AddIcon fontSize="small" />
              <span>Add Standalone Quotation</span>
            </button>
          </div>
        </div>
      </div>

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
      {/* <Tabs
        value={filters.status}
        onChange={(event, newValue) => {
          dispatch(setFilters({ status: newValue }));
          dispatch(setPagination({ page: 1 }));

        }}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 0,
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
      </Tabs> */}

      {/* <div className="flex justify-end w-full mb-2">
        <button
          className="py-2 px-3 rounded-lg text-white text-sm font-medium transition flex items-center justify-center gap-2 shadow-sm hover:shadow"
          style={{ backgroundColor: "#7C3AED", cursor: "pointer" }} // vibrant violet
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#6D28D9")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#7C3AED")}
          //  className="py-2 px-3 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-600 hover:to-emerald-600 shadow-lg hover:shadow-emerald-500/40 transition flex items-center justify-center gap-2 text-sm font-semibold"
          onClick={() => navigate("/standalone/quotation/add")}
        >
          <AddIcon fontSize="small" />
          <span>Add Standalone Quotation</span>
        </button>
      </div> */}


      <div className="px-4 mb-8">
        {boms.length === 0 ? (
          <p className="text-center text-gray-500">No data found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
            {boms.map((sampleOrder) => (
              <Standalonecard
                key={sampleOrder.id}
                sampleOrder={sampleOrder}
                navigate={navigate}
                Enquirysmoduleonly={true}
                requestedquotaion={true}
                handleUpdatepifiles={handleUpdatepifiles}
                onView={handleViewOrder}
                onViewQuote={handleViewQuoatationOrder}
                Quotationpageonly={true}
                prouductionmember={prouductionmember}
                onAssignSuccess={refetchQuotations}
                Viewonlybom={true}

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


      {viewQuoatationModalOpen && viewQuoatationOrder && (
        <QuotationViewModel
          order={viewQuoatationOrder}
          onClose={() => setViewQuoatationOrder(false)}
        />
      )}




      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        itemsPerPage={pagination.limit}
        totalCount={pagination.total}

        startIndex={(pagination.page - 1) * pagination.limit}
        visibleItemCount={boms.length}

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

export default StandaloneQuotationList;
