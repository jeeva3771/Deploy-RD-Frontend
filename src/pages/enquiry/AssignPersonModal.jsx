import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchDesigners,
  assignDesignerToEnquiry,
  fetchAllEnquiries,
} from "../../reducer/enquiryReducer";

const AssignPersonModal = ({ enquiry, onClose, fetchEnquiries, closeViewModal, onCountRefresh  }) => {
  const dispatch = useDispatch();

    const isReassignDesigner = enquiry?.reassignDesigner;

    
  // console.log("isReassignDesigner",isReassignDesigner); 

  const [selectedPerson, setSelectedPerson] = useState("");
  const [remarks, setRemarks] = useState("");

  const { designers, loading } = useSelector((state) => state.enquiry);

  // Fetch designers from Redux
  useEffect(() => {
    dispatch(fetchDesigners());
  }, [dispatch]);

  const handleConfirm = async () => {
    if (!selectedPerson) {
      toast.error("Please select a person");
      return;
    }

    try {
      await dispatch(
        assignDesignerToEnquiry({
          enquiryId: enquiry.id,
          selectedPerson,
          remarks,    
          isReassignDesigner
        })
      ).unwrap();

      toast.success("Designer assigned successfully");
      onClose();

     if (enquiry?.fromViewModal && closeViewModal) {
      closeViewModal();
    }


      // refresh enquiry list
      // dispatch(fetchAllEnquiries());
      fetchEnquiries();
      onCountRefresh();
    } catch (err) {
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

              {loading && <option>Loading...</option>}

              {!loading &&
                designers.map((designer) => (
                  <option key={designer._id} value={designer._id}>
                    {designer.name} - ({designer.role.name})
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

export default AssignPersonModal;
