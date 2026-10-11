import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { backendUrl, axiosInstance } from "../../utils/url/config";
import { useLoader } from "../../context/LoaderContext";
import { toast } from "react-toastify";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import ViewModal from "../components/ViewModal";
import EnquiryCard from "../components/EnquiryCard";
import Pagination from "../components/Pagination";

const DesignHeadList = () => {
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoader();

  const [enquiries, setEnquiries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  const tabs = [
    { label: "All", value: "" },
    { label: "Designer Allocation", value: "enquiry" },
    { label: "Design", value: "design" },
    { label: "Pending", value: "false" },      
    { label: "Processing", value: "true" },  
    { label: "Completed", value: "complete" },  
  ];

  const fetchEnquiries = async () => {
    showLoader();
    try {
   const params = {
      page: currentPage,
      limit: itemsPerPage,
      search: searchTerm,
      status: statusFilter,
    };

    if (
      statusFilter === "true" ||
      statusFilter === "false" ||
      statusFilter === "submit_button" ||
      statusFilter === "complete"
    ) {
      params.status = "design";
    }

    // Add specific filters based on the statusFilter
    if (statusFilter === "true" || statusFilter === "false") {
      params.is_design_processing = statusFilter;
    }

    if (statusFilter === "submit_button") {
      params.submit_button = true;
    }

    if (statusFilter === "complete") {
      params.design_complete = true;
    }

    const response = await axiosInstance.get(`${backendUrl}/enquiry`, { params });

      
      if (response.data.success) {
        setEnquiries(response.data.data || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalCount(response.data.total || 0);
      } else {
        toast.error(response.data.message || "Failed to fetch enquiries");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Error fetching enquiries"
      );
    } finally {
      hideLoader();
    }
  };

  // Fetch enquiries whenever dependencies change
  useEffect(() => {
    fetchEnquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, searchTerm, statusFilter]);

  // Open modal to view enquiry
  const openViewModal = (enquiry) => {
    setModalContent(
      <ViewModal enquiry={enquiry} onClose={() => setModalOpen(false)} />
    );
    setModalOpen(true);
  };

  // Open assign person modal
  const handleUserAction = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setAssignModalOpen(true);
  };

  return (
    <>
      {/* Search & Add Button */}
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
                setCurrentPage(1); // reset page on new search
              }}
            />
            <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>
         
        </div>
      </div>

      {/* Status Tabs */}
      <Tabs
        value={statusFilter}
        onChange={(e, newValue) => {
          setStatusFilter(newValue);
          setCurrentPage(1); // reset page on filter change
        }}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="Status filter tabs"
        sx={{ mb: 2, px: 2 }}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.value}
            label={tab.label}
            value={tab.value}
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
          />
        ))}
      </Tabs>

      {/* Enquiry Cards or No Data Message */}
      <div className="px-4 mb-8">
        {enquiries.length === 0 ? (
          <p className="text-center text-gray-500">No data found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {enquiries.map((enquiry) => (
              <EnquiryCard
                key={enquiry.id}
                enquiry={enquiry}
                openViewModal={() => openViewModal(enquiry)}
                onUserAction={() => handleUserAction(enquiry)}
                showDesignerButton={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
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

      {/* View Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setModalOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>{modalContent}</div>
        </div>
      )}

      {/* Assign Person Modal */}
      {assignModalOpen && selectedEnquiry && (
        <AssignPersonModal
          enquiry={selectedEnquiry}
          onClose={() => setAssignModalOpen(false)}
          fetchEnquiries={fetchEnquiries}
        />
      )}
    </>
  );
};

const AssignPersonModal = ({ enquiry, onClose,fetchEnquiries }) => {
  const [selectedPerson, setSelectedPerson] = useState("");
  const [remarks, setRemarks] = useState("");
  const [designers, setDesigners] = useState([]);


const fetchDesigners = async () => {
  try {
    const response = await axiosInstance.get(`${backendUrl}/user?roleName=design`);
    if (response.data.success) {
      setDesigners(response.data.data || []);
    } else {
      toast.error("Error fetching designers");
    }
  } catch {
    toast.error("Error fetching designers");
  }
};

 useEffect(() => {
  fetchDesigners();
}, []);

const handleConfirm = async () => {
  if (!selectedPerson) {
    toast.error("Please select a person");
    return;
  }

  try {
    const payload = {
      designer_person: [{ user: selectedPerson }],
      designer_remarks: remarks,
      status: "design",
    };

    await axiosInstance.put(`${backendUrl}/enquiry/${enquiry.id}`, payload);
    toast.success("Designer assigned successfully");
    onClose();
    fetchEnquiries(); 
  } catch {
    toast.error("Error assigning person");
  }
};

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            Assign Person to {enquiry?.product_name || "Product"}
          </h2>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Person
            </label>
            <select
              className="appearance-none w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedPerson}
              onChange={(e) => setSelectedPerson(e.target.value)}
            >
              <option value="">Choose a person</option>
              {designers.map((designer) => (
                <option key={designer._id} value={designer._id}>
                  {designer.name} - {designer.role.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remarks
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
              placeholder="Enter remarks..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesignHeadList;
