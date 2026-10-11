import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { axiosInstance, backendUrl } from "../../utils/url/config";
import { useLoader } from "../../context/LoaderContext";
import { toast } from "react-toastify";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { useMediaQuery, useTheme } from "@mui/material";
import ViewModal from "../components/ViewModal";
import EnquiryCard from "../components/EnquiryCard";
import Pagination from "../components/Pagination";
import { getUserPermissions } from "../../utils/permission/auth";
import SizeInputModal from "../components/SizeInputModal";
import ImageConfirmModal from "../components/ImageConfirmModal";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllSampleOrders, updateSampleOrderById } from "../../reducer/sampleSalesorderReducer";
import SampleorderCard from "../salesorder/components/sampleordercard";
import DesignerFileUploadModal from "../salesorder/components/DesignerFileUploadModal";
import DesignerApprovedViewModal from "../salesorder/components/DesignerApprovedViewModal";


const DesignEnquiryList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [enquiries, setEnquiries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [tabCounts, setTabCounts] = useState({
    all: 0,
    false: 0,
    true: 0,
    rework: 0,
    complete: 0,
    requestedfiles: 0
  });

  // State for Units Modal
  const [sizeModalOpen, setSizeModalOpen] = useState(false);
  const [unit, setUnit] = useState("");
  const [productSize, setProductSize] = useState("");
  const [unitsList, setUnitsList] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [savingSize, setSavingSize] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [selectedImageId, setSelectedImageId] = useState(null);

  const { showLoader, hideLoader } = useLoader();

  //designapprovalconfirmation
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmNewFile, setConfirmNewFile] = useState(null);
  const [confirmEnquiry, setConfirmEnquiry] = useState(null);
  const [confirmSlotId, setConfirmSlotId] = useState(null);

  const dispatch = useDispatch();
  const [sampleSalesCount, setSampleSalesCount] = useState(0);

  const triggerSampleSalesCountRefresh = () => {
    setSampleSalesCount((prev) => prev + 1);
  };

  const {
    sampleSalesOrders,
    pagination: samplePagination,
    total: sampleTotal,
    totalPages: sampleTotalPages,
  } = useSelector((state) => state.sampleSalesOrders);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Separate state for the right-side AccountsViewModel drawer
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [viewDrawerOrder, setViewDrawerOrder] = useState(null);

  const tabs = [
    { label: "All", value: "", count: tabCounts.all },
    { label: "Pending", value: "false", count: tabCounts.false },
    { label: "Processing", value: "true", count: tabCounts.true },
    { label: "Rework", value: "rework", count: tabCounts.rework },
    { label: "Completed", value: "complete", count: tabCounts.complete },
    { label: "Approved Design File Upload", value: "requestedfiles", count: tabCounts.requestedfiles }
  ];

  // Fetch counts for tabs
  const fetchTabCounts = useCallback(async () => {
    try {
      const responses = await Promise.all([
        axiosInstance.get(`${backendUrl}/enquiry`, { params: { status: "design", limit: 1 } }),
        axiosInstance.get(`${backendUrl}/enquiry`, { params: { status: "design", is_design_processing: "false", limit: 1 } }),
        axiosInstance.get(`${backendUrl}/enquiry`, { params: { status: "design", is_design_processing: "true", limit: 1 } }),
        axiosInstance.get(`${backendUrl}/enquiry`, { params: { status: "design", rework: true, limit: 1 } }),
        axiosInstance.get(`${backendUrl}/enquiry`, { params: { status: "design", design_complete: true, limit: 1 } }),
        dispatch(fetchAllSampleOrders({ page: 1, limit: 1, status: "designserfilesupload" })).unwrap()
      ]);

      setTabCounts({
        all: responses[0].data.total || 0,
        false: responses[1].data.total || 0,
        true: responses[2].data.total || 0,
        rework: responses[3].data.total || 0,
        complete: responses[4].data.total || 0,
        requestedfiles: responses[5].total || 0
      });
    } catch (error) {
      console.error("Error fetching tab counts:", error);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchTabCounts();
  }, [fetchTabCounts, sampleSalesCount]);

  const fetchEnquiries = useCallback(async () => {
    if (statusFilter === "requestedfiles") return;
    showLoader();
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        status: "design",
      };

      if (statusFilter === "true" || statusFilter === "false") {
        params.is_design_processing = statusFilter;
      }

      if (statusFilter === "submit_button") {
        params.submit_button = true;
      }

      if (statusFilter === "complete") {
        params.design_complete = true;
      }

      if (statusFilter === "rework") {
        params.rework = true;
      }

      const response = await axiosInstance.get(`${backendUrl}/enquiry`, { params });

      if (response.data.success) {
        setEnquiries(response.data.data || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalCount(response.data.total || 0);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching enquiries");
    } finally {
      hideLoader();
    }
  }, [currentPage, itemsPerPage, searchTerm, statusFilter, showLoader, hideLoader]);

  useEffect(() => {
    if (statusFilter !== "requestedfiles") fetchEnquiries();
  }, [fetchEnquiries, statusFilter]);

  useEffect(() => {
    if (statusFilter !== "requestedfiles") return;

    dispatch(
      fetchAllSampleOrders({
        page: samplePagination.page,
        limit: samplePagination.limit,
        search: "",
        status: "designserfilesupload",
      })
    );
  }, [statusFilter, samplePagination.page, samplePagination.limit, dispatch]);

  useEffect(() => {
    if (statusFilter !== "requestedfiles") fetchEnquiries();
  }, [fetchEnquiries, statusFilter]);

  useEffect(() => {
    const fetchUnits = async () => {
      setLoadingUnits(true);
      try {
        const res = await axiosInstance.get(`${backendUrl}/units?is-active=true`);
        if (res.data.success) {
          setUnitsList(res.data.data || []);
        } else {
          toast.error(res.data.message || "Failed to load units");
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Error fetching units");
      } finally {
        setLoadingUnits(false);
      }
    };

    fetchUnits();
  }, []);

  const handleimagessizeinput = (e, enquiry) => {
    e.stopPropagation();
    const imageWithId = enquiry.images.find((img) => img._id && !img.imageunit);
    if (!imageWithId) {
      toast.error("No image found to add size");
      return;
    }

    setSelectedEnquiry(enquiry);
    setSelectedImageId(imageWithId._id);
    setSizeModalOpen(true);
  };

  const handleSaveSize = async () => {
    if (!selectedEnquiry || !selectedImageId) return;

    if (!unit || !productSize) {
      toast.error("Please fill all fields");
      return;
    }

    setSavingSize(true);
    try {
      const formData = new FormData();
      formData.append("image_product_size", JSON.stringify([productSize]));
      formData.append("imageunit", unit);

      const res = await axiosInstance.put(
        `${backendUrl}/enquiry/${selectedEnquiry.id}?inside_images_id=${selectedImageId}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (res.data.success) {
        toast.success(res.data.message || "Product size updated successfully");
        setSizeModalOpen(false);
        setProductSize("");
        setUnit("");
        fetchEnquiries();
        fetchTabCounts();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error updating size");
    } finally {
      setSavingSize(false);
    }
  };

  const [Designerview, setDesignerview] = useState(null);

  useEffect(() => {
    const userPermissions = getUserPermissions();
    const hasDesignerview = Array.isArray(userPermissions) && userPermissions.includes(11);
    setDesignerview(hasDesignerview);
  }, []);

  if (Designerview === null) {
    return <div className="text-center mt-10 text-gray-500">Loading permissions...</div>;
  }

  const openViewModal = (enquiry) => {
    setModalContent(
      <ViewModal
        enquiry={enquiry}
        onClose={() => setModalOpen(false)}
        showimagetable={true}
        Designerviewaccess={Designerview}
      />
    );
    setModalOpen(true);
  };

  const handleViewOrder = (order) => {
    setViewDrawerOrder(order);
    setViewDrawerOpen(true);
  };

  const handleAccept = async (enquiry) => {
    showLoader();
    try {
      const formData = new FormData();
      formData.append("accept_image", true);

      const response = await axiosInstance.put(`${backendUrl}/enquiry/${enquiry.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        setEnquiries((prev) =>
          prev.map((item) =>
            item.id === enquiry.id ? { ...item, accept_image: true } : item
          )
        );
        toast.success("Image accepted successfully");
      } else {
        toast.error(response.data.message || "Failed to accept image");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error accepting image");
    } finally {
      hideLoader();
      fetchEnquiries();
      fetchTabCounts();
    }
  };

  const handleFileUpload = (event, enquiry) => {
    const file = event.target.files[0];
    if (!file) return;

    const targetImage = enquiry.images?.find((img) => !img.url && !img.endtime);

    if (!targetImage?._id) {
      toast.error("No empty slot available to upload an image.");
      return;
    }

    setConfirmNewFile(file);
    setConfirmEnquiry(enquiry);
    setConfirmSlotId(targetImage._id);
    setConfirmModalOpen(true);
  };

  const confirmUploadNow = async () => {
    if (!confirmNewFile || !confirmEnquiry || !confirmSlotId) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("images", confirmNewFile);

      const response = await axiosInstance.put(
        `${backendUrl}/enquiry/${confirmEnquiry.id}?inside_images_id=${confirmSlotId}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.data.success) {
        toast.success("Image uploaded successfully");
      } else {
        toast.error(response.data.message || "Upload failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error uploading image");
    } finally {
      setUploading(false);
      setConfirmModalOpen(false);
      setConfirmNewFile(null);
      setConfirmEnquiry(null);
      setConfirmSlotId(null);
      fetchEnquiries();
      fetchTabCounts();
    }
  };

  const handleComplete = async (enquiryId) => {
    showLoader();
    try {
      const formData = new FormData();
      formData.append("is_completed", true);

      const response = await axiosInstance.put(`${backendUrl}/enquiry/${enquiryId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        toast.success("Enquiry marked as completed");
        fetchEnquiries();
        fetchTabCounts();
      } else {
        toast.error(response.data.message || "Failed to mark as completed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error completing enquiry");
    } finally {
      fetchEnquiries();
      fetchTabCounts();
      hideLoader();
    }
  };

  const handleUpdateapproveddesign = (id) => {
    setSelectedOrderId(id);
    setUploadModalOpen(true);
  };

  const handleUploadFileChange = (e) => {
    setUploadFiles([...uploadFiles, ...Array.from(e.target.files)]);
  };

  const removeUploadedFile = (i) => {
    setUploadFiles(uploadFiles.filter((_, idx) => idx !== i));
  };

  const uploadFilesSubmit = async () => {
    if (uploadFiles.length === 0) {
      toast.error("Please select at least one file to upload.");
      return;
    }

    try {
      setUploadLoading(true);

      const formData = new FormData();
      uploadFiles.forEach((file) => formData.append("designer_files", file));
      formData.append("is_design_uploaded", true);

      await dispatch(updateSampleOrderById({ id: selectedOrderId, formData })).unwrap();

      toast.success("Files uploaded successfully!");

      setUploadModalOpen(false);
      setUploadFiles([]);

      dispatch(
        fetchAllSampleOrders({
          page: samplePagination.page,
          limit: samplePagination.limit,
          search: "",
          status: "designserfilesupload",
        })
      );
      triggerSampleSalesCountRefresh();
    } catch (err) {
      toast.error(err?.message || "File upload failed");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setStatusFilter(newValue);
    setCurrentPage(1);
  };

  // Define colors for each tab
  const getTabColors = (value) => {
    const colorMap = {
      "": { color: "#1e293b", border: "#1e293b", bg: "#1e293b" },
      false: { color: "#f59e0b", border: "#f59e0b", bg: "#f59e0b" },
      true: { color: "#06b6d4", border: "#06b6d4", bg: "#06b6d4" },
      rework: { color: "#f97316", border: "#f97316", bg: "#f97316" },
      complete: { color: "#64748b", border: "#64748b", bg: "#64748b" },
      requestedfiles: { color: "#10b981", border: "#10b981", bg: "#10b981" },
    };
    return colorMap[value] || { color: "#64748b", border: "#64748b", bg: "#64748b" };
  };

  return (
    <>
      <div className="bg-white p-4 shadow-sm mb-6 mt-12">
        <div className="flex justify-between items-center">
          <div className="relative w-96">
            <input
              type="text"
              placeholder="Search by product, client or job number..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>
        </div>
      </div>

      {/* Card-Style Tabs */}
      {isMobile ? (
        <FormControl fullWidth sx={{ mb: 2, px: 2 }}>
          <Select
            value={statusFilter}
            onChange={(e) => handleTabChange(null, e.target.value)}
            displayEmpty
            sx={{
              "& .MuiSelect-select": {
                display: "flex",
                alignItems: "center",
                gap: 1,
              },
            }}
          >
            {tabs.map((tab) => (
              <MenuItem key={tab.value} value={tab.value}>
                {tab.label} {tab.count !== undefined ? `(${tab.count})` : ""}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : (
        <Box
          sx={{
            mb: 3,
            px: 2,
            position: "relative",
          }}
        >
          <Box
            sx={{
              display: "flex",
              gap: 2,
              overflowX: "auto",
              overflowY: "hidden",
              pb: 2,
              scrollBehavior: "smooth",
              "&::-webkit-scrollbar": {
                height: "8px",
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "#f1f5f9",
                borderRadius: "10px",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#cbd5e1",
                borderRadius: "10px",
                "&:hover": {
                  backgroundColor: "#94a3b8",
                },
              },
              scrollbarWidth: "thin",
              scrollbarColor: "#cbd5e1 #f1f5f9",
            }}
          >
            {tabs.map((tab) => {
              const isActive = statusFilter === tab.value;
              const colors = getTabColors(tab.value);

              return (
                <Box
                  key={tab.value}
                  onClick={() => handleTabChange(null, tab.value)}
                  sx={{
                    minWidth: "140px",
                    flexShrink: 0,
                    padding: "15px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    textAlign: "center",
                    background: isActive ? colors.bg : "white",
                    border: isActive ? "none" : `2px solid ${colors.border}`,
                    color: isActive ? "white" : colors.color,
                    boxShadow: isActive
                      ? "0 8px 15px rgba(0,0,0,0.15)"
                      : "0 4px 6px rgba(0,0,0,0.05)",
                    transform: isActive ? "scale(1.05)" : "scale(1)",
                    "&:hover": {
                      transform: "translateY(-3px)",
                      boxShadow: "0 8px 15px rgba(0,0,0,0.1)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      fontSize: "2.5rem",
                      fontWeight: 800,
                      lineHeight: 1,
                      mb: 0.5,
                    }}
                  >
                    {tab.count}
                  </Box>
                  <Box
                    sx={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {tab.label.replace(/_/g, " ")}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      <div className="px-4 mb-8">
        {statusFilter === "requestedfiles" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sampleSalesOrders?.map((sampleOrder) => (
              <SampleorderCard
                key={sampleOrder.id}
                sampleOrder={sampleOrder}
                navigate={navigate}
                Enquirysmoduleonly={true}
                requestedfiles={true}
                handleUpdateapproveddesign={handleUpdateapproveddesign}
                onView={handleViewOrder}
              />
            ))}
          </div>
        ) : enquiries.length === 0 ? (
          <p className="text-center text-gray-500">No data found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {enquiries.map((enquiry) => {
              const acceptbutt =
                enquiry?.is_designer_allocated === true ||
                enquiry?.is_designer_allocated == null;

              return (
                <EnquiryCard
                  key={enquiry.id}
                  enquiry={enquiry}
                  openViewModal={() => openViewModal(enquiry)}
                  handleAccept={handleAccept}
                  showAcceptButton={acceptbutt}
                  handleFileUpload={handleFileUpload}
                  uploading={uploading}
                  handleComplete={handleComplete}
                  designerview={true}
                  handleimagessizeinput={handleimagessizeinput}
                  AssociateRole={false}
                />
              );
            })}
          </div>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={(newItemsPerPage) => {
          setItemsPerPage(newItemsPerPage);
          setCurrentPage(1);
        }}
        totalCount={totalCount}
        startIndex={(currentPage - 1) * itemsPerPage}
        visibleItemCount={enquiries.length}
      />

      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setModalOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>{modalContent}</div>
        </div>
      )}

      {/* Right-side DesignerApprovedViewModal drawer */}
      {viewDrawerOpen && viewDrawerOrder && (
        <DesignerApprovedViewModal
          order={viewDrawerOrder}
          onClose={() => setViewDrawerOpen(false)}
        />
      )}

      <SizeInputModal
        open={sizeModalOpen}
        onClose={() => setSizeModalOpen(false)}
        unitsList={unitsList}
        loadingUnits={loadingUnits}
        unit={unit}
        setUnit={setUnit}
        productSize={productSize}
        setProductSize={setProductSize}
        onSave={handleSaveSize}
        savingSize={savingSize}
      />

      <ImageConfirmModal
        open={confirmModalOpen}
        newImage={confirmNewFile}
        previousImages={
          confirmEnquiry?.images?.filter((i) => i.url)?.map((i) => i.url) || []
        }
        previousImageNames={
          confirmEnquiry?.images?.filter((i) => i.url)?.map((i) => i.name || "image") || []
        }
        confirmLoading={uploading}
        onClose={() => {
          setConfirmModalOpen(false);
          setConfirmNewFile(null);
          setConfirmEnquiry(null);
          setConfirmSlotId(null);
          const fileInputs = document.querySelectorAll('input[type="file"]');
          fileInputs.forEach(input => (input.value = ""));
        }}
        onConfirm={confirmUploadNow}
      />

      <DesignerFileUploadModal
        open={uploadModalOpen}
        files={uploadFiles}
        onClose={() => setUploadModalOpen(false)}
        onFileChange={handleUploadFileChange}
        onRemoveFile={removeUploadedFile}
        onSubmit={uploadFilesSubmit}
        loading={uploadLoading}
      />
    </>
  );
};

export default DesignEnquiryList;