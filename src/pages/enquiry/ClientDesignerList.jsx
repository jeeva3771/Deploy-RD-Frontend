import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { axiosInstance, backendUrl } from "../../utils/url/config";
import { useLoader } from "../../context/LoaderContext";
import { toast } from "react-toastify";
import TabCard from "../components/TabCard";
import PillTabGroup from "../components/PillTabGroup";
import ViewModal from "../components/ViewModal";
import EnquiryCard from "../components/EnquiryCard";
import Pagination from "../components/Pagination";
import DesignerSummary from "./DesignerSummary";
import { getUser, getUserPermissions } from "../../utils/permission/auth";
import AssignPersonModal from "./AssignPersonModal";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { decodeJwt } from "../../utils/helper/jwtHelper";
import Cookies from "js-cookie";
import {
  fetchAllEnquiries,
  fetchEnquiryCounts,
  fetchEnquiryById,
  setFilters,
  setPagination,
  clearSelectedEnquiry,
  approveRejectImage,
  fetchDesigners,
  resetFilters,
} from "../../reducer/enquiryReducer";
import { useDispatch, useSelector } from "react-redux";
import SizeInputModal from "../components/SizeInputModal";
import ImageConfirmModal from "../components/ImageConfirmModal";
import SampleorderCard from "../salesorder/components/sampleordercard";
import {
  fetchAllSampleOrders,
  updateSampleOrderById,
  setPagination as setSampleOrderPagination,
  setFilters as setSampleOrderFilters,
} from "../../reducer/sampleSalesorderReducer";
import DesignerFileUploadModal from "../salesorder/components/DesignerFileUploadModal";
import VerifyPIModal from "../salesorder/components/VerifyPIModal";
import VerifyQuotationModal from "../salesorder/components/VerifyQuotationModal";
import { useTheme } from "@emotion/react";
import { useMediaQuery } from "@mui/material";

const ClientDesignerList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { enquiries, loading, pagination, filters, designers } = useSelector(
    (state) => state.enquiry,
  );

  const { enquiryCounts } = useSelector((state) => state.enquiry);

  const {
    sampleSalesOrders,
    pagination: samplePagination,
    total: sampleTotal,
    totalPages: sampleTotalPages,
  } = useSelector((state) => state.sampleSalesOrders);
  // console.log("sampleSalesOrders",sampleSalesOrders)

  const selectedDesigner = filters.designerId || "";

  // const [enquiries, setEnquiries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [designerModalOpen, setDesignerModalOpen] = useState(false);
  // const [designers, setDesigners] = useState([]);
  // const [selectedDesigner, setSelectedDesigner] = useState("");
  const [permissions, setPermissions] = useState([]);
  const [isHead, setIsHead] = useState(false);
  const [userRole, setuserRole] = useState("");

  const [uploading, setUploading] = useState(false);

  // 🔹 State for Units Modal
  const [sizeModalOpen, setSizeModalOpen] = useState(false);
  const [unit, setUnit] = useState("");
  const [productSize, setProductSize] = useState("");
  const [unitsList, setUnitsList] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [savingSize, setSavingSize] = useState(false);

  const [selectedImageId, setSelectedImageId] = useState(null);

  const { showLoader, hideLoader } = useLoader();

  const Designerview = permissions.includes(11);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  //designapprovalconfirmation
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmNewFile, setConfirmNewFile] = useState(null);
  const [confirmEnquiry, setConfirmEnquiry] = useState(null);
  const [confirmSlotId, setConfirmSlotId] = useState(null);

  const [sampleType, setSampleType] = useState("");
  const [countTrigger, setCountTrigger] = useState(0);

  const isApproved =
    filters.status === "approveddesigns" ||
    filters.status === "requestedfiles" ||
    filters.status === "approveddesignsaccounts" ||
    filters.status === "approvedquotation";

  const AccountTabActivated = filters.status === "approveddesignsaccounts";
  const QuotatationTabActivated = filters.status === "approvedquotation";
  const JobInProgressActivated = filters.status === "jobinprogress";
  const DispatchActivated = filters.status === "dispatch";

  // console.log("AcoounttabAcrivated",AccountTabActivated)

  const dataList = isApproved ? sampleSalesOrders : enquiries;
  const activePagination = isApproved
    ? samplePagination || {
        page: 1,
        limit: pagination.limit,
        total: 0,
        totalPages: 1,
      }
    : pagination;

  //   console.log('filters.status (render):', filters.status);
  // console.log('enquiries.length:', enquiries.length, 'sampleSalesOrders.length:', sampleSalesOrders.length);

  useEffect(() => {
    dispatch(fetchEnquiryCounts("cd"));
  }, [dispatch, countTrigger]);

  useEffect(() => {
    // Reset filters & pagination when component mounts
    dispatch(resetFilters());
    dispatch(setPagination({ page: 1, limit: 8 }));
  }, [dispatch]);

  useEffect(() => {
    // const userData = Cookies.get("auth");
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!userData) {
      navigate("/login");
      return;
    }

    const parsed = token;
    if (!parsed) {
      navigate("/login");
      return;
    }

    const decoded = decodeJwt(parsed);
    if (!decoded) {
      navigate("/login");
      return;
    }

    setIsHead(decoded.is_head || false);

    setuserRole(decoded.role || "");

    // console.log("Decoded JWT:", decoded);
  }, [navigate]);

  const DesignRole = userRole?.toLowerCase().includes("design");

  const hasPermission9AndHead = permissions.includes(9) && isHead && DesignRole;

  let canSeeAll = permissions.includes(9);

  if (hasPermission9AndHead) {
    canSeeAll = false;
  }

  const canSeeDesignHead = hasPermission9AndHead;

  const AssociateRole = userRole === "Associate";

  const SalesRole = userRole?.toLowerCase().includes("client servicing");
  const AdminRole = userRole?.toLowerCase().includes("admin executive");

  // console.log("SalesRole",SalesRole)

  // console.log("AssociateRole", AssociateRole);
  // console.log("canSeeDesignHead",canSeeDesignHead)

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Calculate active main pill group based on current filters.status
  const currentStatus = filters.status || "";

  let activeMainGroup = "all";
  if (currentStatus === "designerallocation") {
    activeMainGroup = "allocation";
  } else if (
    [
      "design",
      "false",
      "true",
      "submit_button",
      "rework",
      "redo",
      "complete",
    ].includes(currentStatus)
  ) {
    activeMainGroup = "indesign";
  } else if (
    [
      "approveddesigns",
      "approvedquotation",
      "reprocessedquotation",
      "approveddesignsaccounts",
      "requestedfiles",
      "jobinprogress",
      "dispatch",
    ].includes(currentStatus)
  ) {
    activeMainGroup = "completed";
  } else if (["abandon", "on_hold"].includes(currentStatus)) {
    activeMainGroup = "closed_hold";
  }

  // Group Totals
  const inDesignTotal =
    (enquiryCounts?.cd_design || 0) + (enquiryCounts?.cd_design_complete || 0);
  const completedTotal =
    (enquiryCounts?.cd_approveddesign || 0) +
    (enquiryCounts?.cd_quotation || 0) +
    (enquiryCounts?.cd_approveddesigns_accounts || 0) +
    (enquiryCounts?.cd_jobinprogress || 0) +
    (enquiryCounts?.cd_dispatch || 0) +
    (canSeeDesignHead ? enquiryCounts?.cd_designerfilesupload || 0 : 0);

  const closedHoldTotal =
    (enquiryCounts?.cd_abandon || 0) + (enquiryCounts?.cd_on_hold || 0);

  // 5 Main Tabs (Pills)
  const mainPills = [
    { label: "All", value: "all", count: enquiryCounts?.cd_all || 0 },
    {
      label: "Allocation",
      value: "allocation",
      count: enquiryCounts?.cd_designer_allocation || 0,
    },
    { label: "In Design", value: "indesign", count: inDesignTotal },
    {
      label: "Completed & Approvals",
      value: "completed",
      count: completedTotal,
    },
    { label: "Closed / Hold", value: "closed_hold", count: closedHoldTotal },
  ];

  // Contextual Sub Tabs (Sub Pills)
  let subPills = [];
  if (activeMainGroup === "indesign") {
    subPills = [
      {
        label: "All In Design",
        value: "design",
        count: enquiryCounts?.cd_design || 0,
      },
      {
        label: "Pending",
        value: "false",
        count: enquiryCounts?.cd_design_pending || 0,
      },
      {
        label: "Processing",
        value: "true",
        count: enquiryCounts?.cd_design_processing || 0,
      },
      {
        label: "Ready to Submit",
        value: "submit_button",
        count: enquiryCounts?.cd_submit_button || 0,
      },
      {
        label: "Rework",
        value: "rework",
        count: enquiryCounts?.cd_rework || 0,
      },
      {
        label: "Design Completed",
        value: "complete",
        count: enquiryCounts?.cd_design_complete || 0,
      },
    ];
  } else if (activeMainGroup === "completed") {
    const commercialTotal =
      (enquiryCounts?.cd_quotation || 0) +
      (enquiryCounts?.cd_approveddesigns_accounts || 0);

    const isCommercialActive = [
      "commercial",
      "approvedquotation",
      "reprocessedquotation",
      "approveddesignsaccounts",
    ].includes(filters.status);

    subPills = [
      {
        label: "Approved Designs",
        value: "approveddesigns",
        count: enquiryCounts?.cd_approveddesign || 0,
      },
      {
        label: "Commercial",
        value: "commercial",
        count: commercialTotal,
        renderAfter: isCommercialActive ? (
          <FormControl variant="outlined" size="small" sx={{ minWidth: 160 }}>
            <Select
              value={filters.status}
              onChange={(e) => handleTabChange(null, e.target.value)}
              size="small"
              className="bg-white dark:bg-gray-800 dark:text-gray-100 font-semibold text-xs rounded-full shadow-sm"
              sx={{
                height: "32px",
                borderRadius: "9999px",
                "& .MuiSelect-select": {
                  paddingTop: "4px",
                  paddingBottom: "4px",
                  paddingLeft: "12px",
                  paddingRight: "28px !important",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#2563eb",
                },
              }}
            >
              <MenuItem value="approvedquotation">
                Quotation ({enquiryCounts?.cd_quotation || 0})
              </MenuItem>
              <MenuItem value="approveddesignsaccounts">
                Accounts ({enquiryCounts?.cd_approveddesigns_accounts || 0})
              </MenuItem>
            </Select>
          </FormControl>
        ) : null,
      },
      {
        label: "Job In Progress",
        value: "jobinprogress",
        count: enquiryCounts?.cd_jobinprogress || 0,
      },
      {
        label: "Dispatch",
        value: "dispatch",
        count: enquiryCounts?.cd_dispatch || 0,
      },
    ];
    if (canSeeDesignHead) {
      subPills.push({
        label: "Approved Design File Upload",
        value: "requestedfiles",
        count: enquiryCounts?.cd_designerfilesupload || 0,
      });
    }
  } else if (activeMainGroup === "closed_hold") {
    subPills = [
      {
        label: "Abandon",
        value: "abandon",
        count: enquiryCounts?.cd_abandon || 0,
      },
      {
        label: "On Hold",
        value: "on_hold",
        count: enquiryCounts?.cd_on_hold || 0,
      },
    ];
  }

  const handleMainPillChange = (mainValue) => {
    let targetStatus = "";
    if (mainValue === "all") targetStatus = "";
    else if (mainValue === "allocation") targetStatus = "designerallocation";
    else if (mainValue === "indesign") targetStatus = "design";
    else if (mainValue === "completed") targetStatus = "approveddesigns";
    else if (mainValue === "closed_hold") targetStatus = "abandon";

    handleTabChange(null, targetStatus);
  };

  //   console.log("canSeeAll",canSeeAll)
  // console.log("canSeeDesignHead",canSeeDesignHead)
  // console.log("Designerview", Designerview)

  useEffect(() => {
    const userPermissions = getUserPermissions();
    setPermissions(userPermissions);
  }, []);

  useEffect(() => {
    dispatch(fetchDesigners());
  }, [dispatch]);

  const buildEnquiryParams = useCallback(() => {
    const params = {
      page: activePagination.page || 1,
      limit: activePagination.limit || 8,
      search: filters.search || "",
      status: filters.status,
      is_client_design: true,
    };

    if (filters.designerId) params.designerId = filters.designerId;

    if (filters.status === "redo") {
      params.redo = true;
      params.status = "design";
    }

    if (filters.status === "rework") {
      params.rework = true;
      params.status = "design";
    }

    if (filters.status === "designerallocation") {
      params.designerallocation = true;
      params.status = "";
    }

    if (filters.status === "submit_button") {
      params.submit_button = true;
      params.status = "design";
    }

    if (
      filters.status === "true" ||
      filters.status === "false" ||
      filters.status === "submit_button"
    ) {
      params.status = "design";
    }

    if (filters.status === "true" || filters.status === "false") {
      params.is_design_processing = filters.status;
    }

    if (filters.status === "submit_button") {
      params.submit_button = true;
    }

    if (filters.status === "complete") {
      params.design_complete = true;
      params.status = "";
    }

    if (filters.status === "on_hold") {
      params.is_on_hold = true;
      params.status = "";
    }

    if (filters.status === "quatation") {
      params.quatation_purpose_only = true;
      params.status = "";
    }

    return params;
  }, [
    activePagination.page,
    activePagination.limit,
    filters.search,
    filters.status,
    filters.designerId,
  ]);

  // Load enquiries / sample orders when filters/pagination change
  useEffect(() => {
    let mounted = true;

    const loadEnquiries = async () => {
      showLoader();

      try {
        // CASE 1 ---------------------
        if (filters.status === "requestedfiles") {
          await dispatch(
            fetchAllSampleOrders({
              page: activePagination.page || 1,
              limit: activePagination.limit || 8,
              search: "",
              status: "designserfilesupload",
            }),
          ).unwrap();
        }

        // CASE 2 ---------------------
        else if (filters.status === "approveddesigns") {
          const payload = {
            page: activePagination.page || 1,
            limit: activePagination.limit || 8,
            search: filters.search || "",
            status: filters.status,
            is_client_design: true,
            ...(sampleType !== "" ? { type: sampleType } : {}),
          };

          await dispatch(fetchAllSampleOrders(payload)).unwrap();
        }

        // CASE 3 ---------------------
        else if (filters.status === "approveddesignsaccounts") {
          const payload = {
            page: activePagination.page || 1,
            limit: activePagination.limit || 8,
            search: filters.search || "",
            status: filters.status,
            is_client_design: true,
            ...(sampleType !== "" ? { type: sampleType } : {}),
          };

          await dispatch(fetchAllSampleOrders(payload)).unwrap();
        }

        // CASE 4 ---------------------
        else if (filters.status === "approvedquotation") {
          const payload = {
            page: activePagination.page || 1,
            limit: activePagination.limit || 8,
            search: filters.search || "",
            status: filters.status,
            is_client_design: true,
            ...(sampleType !== "" ? { type: sampleType } : {}),
          };

          await dispatch(fetchAllSampleOrders(payload)).unwrap();
        }

        // DEFAULT CASE ---------------
        else {
          const params = buildEnquiryParams();
          await dispatch(fetchAllEnquiries(params)).unwrap();
        }
      } catch (err) {
        console.error("loadEnquiries error:", err);
      } finally {
        if (mounted) hideLoader();
      }
    };

    loadEnquiries();

    return () => {
      mounted = false;
    };
  }, [
    dispatch,
    activePagination.page,
    activePagination.limit,
    filters.status,
    filters.search,
    filters.designerId,
    buildEnquiryParams,
    sampleType,
    isApproved,
    showLoader,
    hideLoader,
  ]);

  ///designerfile upload
  const handleUpdateapprovedfilesdesign = (id) => {
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

      await dispatch(
        updateSampleOrderById({ id: selectedOrderId, formData }),
      ).unwrap();

      toast.success("Files uploaded successfully!");

      // Close modal
      setUploadModalOpen(false);
      setUploadFiles([]);

      // Refresh sample order list
      dispatch(
        fetchAllSampleOrders({
          page: samplePagination.page,
          limit: samplePagination.limit,
          search: "",
          status: "designserfilesupload",
        }),
      );
    } catch (err) {
      toast.error(err?.message || "File upload failed");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleTypeChange = (type) => {
    const value = type === "all" ? "" : type;
    setSampleType(value);

    dispatch(
      fetchAllSampleOrders({
        page: 1,
        limit: pagination.limit,
        search: filters.search,
        status: filters.status,
        is_client_design: true,
        ...(value !== "" ? { type: value } : {}),
      }),
    );
    dispatch(setPagination({ page: 1 }));
  };

  const getCurrentType = () => {
    if (sampleType === "") return "all";
    return sampleType;
  };

  const showTypeFilter =
    filters.status === "approveddesigns" ||
    filters.status === "approveddesignsaccounts" ||
    filters.status === "approvedquotation";

  // near top of component
  // console.log('filters.status (render):', filters.status);
  // console.log('enquiries.length:', enquiries.length);
  // console.log('sampleSalesOrders (render):', sampleSalesOrders);

  // Handle search
  const handleSearch = (e) => {
    const val = e.target.value;
    dispatch(setFilters({ search: val }));
    dispatch(setSampleOrderFilters({ search: val }));
    dispatch(setPagination({ page: 1 }));
    dispatch(setSampleOrderPagination({ page: 1 }));
  };

  function handleTabChange(event, newValue) {
    const targetStatus =
      newValue === "commercial" ? "approvedquotation" : newValue;
    dispatch(setFilters({ status: targetStatus }));
    dispatch(setPagination({ page: 1 }));
    dispatch(setSampleOrderPagination({ page: 1 }));
    setSampleType("");
  }

  const reloadEnquiries = () => {
    const params = buildEnquiryParams();
    dispatch(fetchAllEnquiries(params));
  };

  const triggerCountRefresh = () => {
    setCountTrigger((prev) => prev + 1);
  };

  const handleAcceptReject = (
    enquiry,
    imageId,
    value,
    onUpdate,
    fetchEnquiries,
  ) => {
    dispatch(
      approveRejectImage({ enquiryId: enquiry.id, imageId, isAccepted: value }),
    )
      .unwrap()
      .then(() => {
        toast.success(`Image ${value ? "approved" : "rejected"} successfully`);

        if (onUpdate && typeof onUpdate === "function") {
          onUpdate({ _id: imageId, is_accepted: value });
        }

        fetchEnquiries();
        triggerCountRefresh();
      })
      .catch((err) => {
        toast.error(err?.message || "Server error");
      });
  };

  const openViewModal = (enquiry) => {
    setModalContent(
      <ViewModal
        onCountRefresh={triggerCountRefresh}
        enquiry={enquiry}
        onClose={() => setModalOpen(false)}
        showimagetable={true}
        handleAcceptReject={handleAcceptReject}
        showadminbuttons={canSeeAll}
        designheadviewdesign={canSeeDesignHead}
        fetchEnquiries={reloadEnquiries}
        AssociateRole={AssociateRole}
      />,
    );
    setModalOpen(true);
  };

  // Open assign person modal
  const handleUserAction = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setAssignModalOpen(true);
  };

  const handleAccept = async (enquiry) => {
    showLoader();
    try {
      const formData = new FormData();
      formData.append("accept_image", true);

      const response = await axiosInstance.put(
        `${backendUrl}/enquiry/${enquiry.id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      if (response.data.success) {
        toast.success("Image accepted successfully");
      } else {
        toast.error(response.data.message || "Failed to accept image");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error accepting image");
    } finally {
      hideLoader();
      reloadEnquiries(); // Redux refresh
      triggerCountRefresh();
    }
  };

  const handleFileUpload = (event, enquiry) => {
    const file = event.target.files[0];
    if (!file) return;

    // Find next empty slot
    const targetImage = enquiry.images?.find((img) => !img.url && !img.endtime);

    if (!targetImage?._id) {
      toast.error("No empty slot available to upload an image.");
      return;
    }

    // Store for confirmation modal
    setConfirmNewFile(file);
    setConfirmEnquiry(enquiry);
    setConfirmSlotId(targetImage._id);

    // Open modal
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
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      if (response.data.success) {
        toast.success("Image uploaded successfully");
        triggerCountRefresh();
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

      reloadEnquiries();
    }
  };

  useEffect(() => {
    const fetchUnits = async () => {
      setLoadingUnits(true);
      try {
        const res = await axiosInstance.get(
          `${backendUrl}/units?is-active=true`,
        );
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

  const handleComplete = async (enquiryId) => {
    showLoader();
    try {
      const formData = new FormData();
      formData.append("is_completed", true);

      const response = await axiosInstance.put(
        `${backendUrl}/enquiry/${enquiryId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.data.success) {
        toast.success("Enquiry marked as completed");
        reloadEnquiries(); // Refresh list
        triggerCountRefresh();
      } else {
        toast.error(response.data.message || "Failed to mark as completed");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Error completing enquiry");
    } finally {
      reloadEnquiries();
      hideLoader();
    }
  };

  const handleimagessizeinput = (e, enquiry) => {
    // console.log("enquiry",enquiry)
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
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      if (res.data.success) {
        toast.success(res.data.message || "Product size updated successfully");
        setSizeModalOpen(false);
        setProductSize("");
        setUnit("");
        reloadEnquiries();
        triggerCountRefresh();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error updating size");
    } finally {
      setSavingSize(false);
    }
  };

  //for Sales order tab

  const handleUpdateapproveddesign = async (orderId) => {
    try {
      showLoader();

      const formData = new FormData();
      formData.append("is_verified_to_proceed", true);

      const res = await dispatch(
        updateSampleOrderById({
          id: orderId,
          formData,
        }),
      ).unwrap();

      toast.success("Updated successfully!");

      dispatch(
        fetchAllSampleOrders({
          page: activePagination.page || 1,
          limit: activePagination.limit || pagination.limit,
          search: filters.search,
          status: filters.status,
          ...(sampleType !== "" ? { type: sampleType } : {}),
        }),
      );
    } catch (err) {
      toast.error(err?.message || "Update failed");
    } finally {
      hideLoader();
    }
  };

  //verify pi

  const [selectedPIFile, setSelectedPIFile] = useState([]); // store PI files array
  const [selectedPIId, setSelectedPIId] = useState(null); // store sample order ID
  const [verifyPIModalOpen, setVerifyPIModalOpen] = useState(false);
  const [selectedPIData, setSelectedPIData] = useState(null);

  const handleVerifyPI = (piFiles, id, pi) => {
    setSelectedPIFile(piFiles); // store the array
    setSelectedPIId(id);
    setSelectedPIData(pi);
    setVerifyPIModalOpen(true);
  };

  // Close modal and reset
  const closeVerifyPIModal = () => {
    setVerifyPIModalOpen(false);
    setSelectedPIFile([]);
    setSelectedPIId(null);
  };

  // Function to view file
  const handleViewPI = (file) => {
    window.open(file.url, "_blank");
  };

  ///update pi verification
  const handleRefresh = () => {
    dispatch(
      fetchAllSampleOrders({
        page: samplePagination.page,
        limit: samplePagination.limit,
        search: "",
        status: "approveddesignsaccounts",
        is_client_design: true,
      }),
    );
    triggerCountRefresh();
  };

  //verify quotation

  const [selectedQuotationFile, setSelectedQuotationFile] = useState([]); // store PI files array
  const [selectedQuotationId, setSelectedQuotationId] = useState(null); // store sample order ID
  const [verifyQuotationModalOpen, setVerifyQuotationModalOpen] =
    useState(false);
  const [selectedQuotationData, setSelectedQuotationData] = useState(null);

  const handleVerifyQuotation = (QuotationFiles, id, Quotation) => {
    setSelectedQuotationFile(QuotationFiles); // store the array
    setSelectedQuotationId(id);
    setSelectedQuotationData(Quotation);
    setVerifyQuotationModalOpen(true);
  };

  // Close modal and reset
  const closeVerifyQuotationModal = () => {
    setVerifyQuotationModalOpen(false);
    setSelectedQuotationFile([]);
    setSelectedQuotationId(null);
  };

  // Function to view file
  const handleViewQuotation = (file) => {
    window.open(file.url, "_blank");
  };

  ///update Quotation verification
  const handleRefreshQuotation = () => {
    dispatch(
      fetchAllSampleOrders({
        page: samplePagination.page,
        limit: samplePagination.limit,
        search: "",
        status: "approvedquotation",
        is_client_design: false,
      }),
    );
  };

  return (
    <>
      <div className="bg-white p-4 shadow-sm mb-6 mt-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Search Input */}
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              placeholder="Search by product, client or job number..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              value={filters.search}
              onChange={handleSearch}
            />
            <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>

          {showTypeFilter && (
            <div className="w-full lg:w-auto flex justify-center">
              <div className="inline-flex bg-gray-100 rounded-full shadow-sm border border-gray-200 p-1">
                <button
                  onClick={() => handleTypeChange("all")}
                  className={`
                    px-5 py-2 text-xs font-bold uppercase tracking-wide
                    rounded-full transition-all duration-200
                    ${
                      getCurrentType() === "all"
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
                    ${
                      getCurrentType() === "production"
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
                    ${
                      getCurrentType() === "sample"
                        ? "bg-gray-800 text-white shadow-md"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }
                  `}
                >
                  Sample
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons and Select */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {!AssociateRole && (
              <FormControl
                variant="outlined"
                size="small"
                className="w-full sm:min-w-[280px]"
              >
                <Select
                  value={selectedDesigner}
                  onChange={(e) => {
                    dispatch(setFilters({ designerId: e.target.value }));
                    dispatch(setPagination({ page: 1 }));
                    triggerCountRefresh();
                  }}
                  displayEmpty
                  size="small"
                  className="capitalize dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  inputProps={{
                    style: {
                      paddingRight: "32px", // Ensure space for arrow
                      paddingLeft: "12px",
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      className:
                        "dark:bg-gray-800 dark:text-gray-100 min-w-[280px]",
                    },
                  }}
                >
                  <MenuItem value="">
                    <span className="text-[var(--theme-text-muted)] dark:text-gray-400 pr-4">
                      All Designers
                    </span>
                  </MenuItem>
                  {designers.map((designer) => (
                    <MenuItem
                      key={designer._id}
                      value={designer._id}
                      className="capitalize pr-4"
                    >
                      <span className="pr-4">{designer.name}</span>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 w-full sm:w-auto">
              {/* Designers Button */}

              {!AssociateRole && (
                <button
                  className="primary-bgclr hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors whitespace-nowrap flex-1 sm:flex-initial"
                  onClick={() => setDesignerModalOpen(true)}
                  style={{ backgroundColor: "#574fdd" }}
                >
                  <i className="fa-solid fa-eye mr-2"></i>Designers
                </button>
              )}

              {/* Add Enquiry Button */}
              {canSeeAll && (
                <button
                  className="primary-bgclr hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors whitespace-nowrap flex-1 sm:flex-initial"
                  onClick={() => navigate("/enquiriesc/add")}
                  style={{ backgroundColor: "#574fdd" }}
                >
                  <i className="fa-solid fa-plus mr-2"></i>Add Enquiry
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* <Tabs
          value={filters.status || ""}  

                onChange={handleTabChange}
            variant="scrollable"
            color="gray"
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
            {tabs.map((tab) => (
              <Tab key={tab.value} label={tab.label} value={tab.value} />
            ))}
          </Tabs> */}

      <div className="px-4 mb-4 space-y-3">
        {/* Main 5-Pill Bar */}
        <PillTabGroup
          tabs={mainPills}
          activeValue={activeMainGroup}
          onChange={handleMainPillChange}
          size="normal"
        />

        {/* Secondary Sub-Pill Bar */}
        {subPills.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-2xl border border-gray-100 dark:border-gray-800">
            <PillTabGroup
              tabs={subPills}
              activeValue={
                [
                  "approvedquotation",
                  "reprocessedquotation",
                  "approveddesignsaccounts",
                ].includes(filters.status)
                  ? "commercial"
                  : filters.status || ""
              }
              onChange={(val) => {
                if (val === "commercial") {
                  if (
                    ![
                      "approvedquotation",
                      "reprocessedquotation",
                      "approveddesignsaccounts",
                    ].includes(filters.status)
                  ) {
                    handleTabChange(null, "approvedquotation");
                  }
                } else {
                  handleTabChange(null, val);
                }
              }}
              size="small"
            />
          </div>
        )}
      </div>

      {/* Only show when Approved Designs tab is selected */}
      {/* {filters.status === "approveddesigns" && (
        <div className="flex justify-end w-full mb-2">
          <FormControl
            variant="outlined"
            size="small"
            className="w-32 sm:w-40" // smaller width
          >
            <Select
              value={sampleType}
              onChange={(e) => {
                setSampleType(e.target.value);
                dispatch(
                  fetchAllSampleOrders({
                    page: 1,
                    limit: pagination.limit,
                    search: filters.search,
                    status: "approveddesigns",
                    is_client_design: true,
                    ...(e.target.value !== "" ? { type: e.target.value } : {}),
                  }),
                );
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
        </div>
      )} */}

      {/* {(filters.status === "approveddesignsaccounts" ||
        filters.status === "approvedquotation") && (
        <div className="flex justify-end w-full mb-2">
          <FormControl
            variant="outlined"
            size="small"
            className="w-32 sm:w-40" // smaller width
          >
            <Select
              value={sampleType}
              onChange={(e) => {
                setSampleType(e.target.value);
                dispatch(
                  fetchAllSampleOrders({
                    page: 1,
                    limit: pagination.limit,
                    search: filters.search,
                    status: filters.status,
                    is_client_design: true,
                    ...(e.target.value !== "" ? { type: e.target.value } : {}),
                  }),
                );
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
        </div>
      )} */}

      <div className="px-4 mb-8">
        {dataList.length === 0 ? (
          <p className="text-center text-gray-500">No data found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6"> */}
            {isApproved
              ? dataList.map((sampleOrder) => (
                  <SampleorderCard
                    key={sampleOrder.id}
                    sampleOrder={sampleOrder}
                    navigate={navigate}
                    Enquirysmoduleonly={true}
                    handleUpdate={handleUpdateapproveddesign}
                    requestedfiles={DesignRole}
                    handleUpdateapprovedfiledesign={
                      handleUpdateapprovedfilesdesign
                    }
                    Enquirypageonly={true}
                    AccountTabActivated={AccountTabActivated}
                    QuotatationTabActivated={QuotatationTabActivated}
                    JobInProgressActivated={JobInProgressActivated}
                    DispatchActivated={DispatchActivated}
                    handleVerifyPI={handleVerifyPI}
                    handleVerifyQuotation={handleVerifyQuotation}
                    Designheadpage={canSeeDesignHead}
                    AdminRole={AdminRole}

                    //            fetchSampleorders={
                    //   !DesignRole
                    //     ? () =>
                    //         dispatch(
                    //           fetchAllSampleOrders({
                    //             page: activePagination.page,
                    //             limit: activePagination.limit,
                    //             search: filters.search,
                    //             status: filters.status,
                    //             ...(sampleType !== "" ? { type: sampleType } : {}),
                    //           })
                    //         )
                    //     : () =>
                    //         dispatch(
                    //           fetchAllSampleOrders({
                    //             page: samplePagination.page,
                    //             limit: samplePagination.limit,
                    //             search: "",
                    //             status: "designserfilesupload",
                    //           })
                    //         )
                    // }
                  />
                ))
              : dataList.map((enquiry) => {
                  const acceptbutt =
                    enquiry?.is_designer_allocated === true ||
                    enquiry?.is_designer_allocated == null;

                  return (
                    <EnquiryCard
                      key={enquiry.id}
                      enquiry={enquiry}
                      openViewModal={() => openViewModal(enquiry)}
                      showEditButton={canSeeAll}
                      showDesignerButton={
                        canSeeAll && filters.status !== "enquiry"
                      }
                      onUserAction={
                        canSeeAll || canSeeDesignHead
                          ? () => handleUserAction(enquiry)
                          : undefined
                      }
                      showadminbuttons={canSeeAll}
                      canSeeDesignHeadbutton={
                        canSeeDesignHead && filters.status !== "design"
                      }
                      fetchEnquiries={reloadEnquiries}
                      onCountRefresh={triggerCountRefresh}
                      AssociateRole={AssociateRole}
                      showAcceptButton={acceptbutt}
                      handleAccept={handleAccept}
                      handleFileUpload={handleFileUpload}
                      handleComplete={handleComplete}
                      handleimagessizeinput={handleimagessizeinput}
                      SalesRole={SalesRole}
                      clientdesginerscreen={true}
                    />
                  );
                })}
          </div>
        )}
      </div>

      <Pagination
        currentPage={activePagination.page}
        totalPages={activePagination.totalPages}
        itemsPerPage={activePagination.limit}
        totalCount={activePagination.total}
        startIndex={(activePagination.page - 1) * activePagination.limit}
        visibleItemCount={dataList.length}
        onPageChange={(newPage) => {
          dispatch(setPagination({ page: newPage }));
          dispatch(setSampleOrderPagination({ page: newPage }));
          if (isApproved) {
            dispatch(
              fetchAllSampleOrders({
                page: newPage,
                limit: activePagination.limit,
                status: filters.status,
                ...(sampleType ? { type: sampleType } : {}),
              }),
            );
          }
        }}
        onItemsPerPageChange={(newLimit) => {
          dispatch(setPagination({ limit: newLimit, page: 1 }));
          dispatch(setSampleOrderPagination({ limit: newLimit, page: 1 }));
          if (isApproved) {
            dispatch(
              fetchAllSampleOrders({
                page: 1,
                limit: newLimit,
                status: filters.status,
                ...(sampleType ? { type: sampleType } : {}),
              }),
            );
          }
        }}
      />

      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-7xl max-h-[90vh] overflow-auto"
          >
            {modalContent}
          </div>
        </div>
      )}

      {/* Assign Person Modal */}
      {assignModalOpen && selectedEnquiry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl"
          >
            <AssignPersonModal
              onCountRefresh={triggerCountRefresh}
              enquiry={selectedEnquiry}
              onClose={() => setAssignModalOpen(false)}
              fetchEnquiries={reloadEnquiries}
            />
          </div>
        </div>
      )}

      {designerModalOpen && (
        <>
          {/* Designer Modal */}
          <div
            className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4
        ${designerModalOpen ? "visible opacity-100" : "invisible opacity-0"}`}
            onClick={() => designerModalOpen && setDesignerModalOpen(false)}
            style={{ transition: "opacity 0.1s linear" }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl bg-white rounded-lg"
            >
              {designerModalOpen && (
                <DesignerSummary onClose={() => setDesignerModalOpen(false)} />
              )}
            </div>
          </div>
        </>
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
          confirmEnquiry?.images
            ?.filter((i) => i.url)
            ?.map((i) => i.name || "image") || []
        }
        confirmLoading={uploading}
        onClose={() => {
          setConfirmModalOpen(false);
          setConfirmNewFile(null);
          setConfirmEnquiry(null);
          setConfirmSlotId(null);
          const fileInputs = document.querySelectorAll('input[type="file"]');
          fileInputs.forEach((input) => (input.value = ""));
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

      <VerifyPIModal
        isOpen={verifyPIModalOpen}
        onClose={closeVerifyPIModal}
        piFiles={selectedPIFile}
        sampleOrderId={selectedPIId}
        onView={handleViewPI}
        onVerified={handleRefresh}
        onRework={handleRefresh}
        sampleOrders={selectedPIData}
      />

      <VerifyQuotationModal
        isOpen={verifyQuotationModalOpen}
        onClose={closeVerifyQuotationModal}
        QuotationFiles={selectedQuotationFile}
        sampleOrderId={selectedQuotationId}
        onView={handleViewQuotation}
        onVerified={handleRefreshQuotation}
        onRework={handleRefreshQuotation}
        sampleOrders={selectedQuotationData}
      />
    </>
  );
};

export default ClientDesignerList;
