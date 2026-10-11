import React, { useState, useEffect } from "react";
import axios from "axios";
import { backendUrl,axiosInstance } from "../../utils/url/config";
import { toast } from "react-toastify";
import { useLoader } from "../../context/LoaderContext";  
import JobNumbersModal from "./JobNumbersModal";  
import { useDispatch, useSelector } from "react-redux";
import { fetchDesignerSummary } from "../../reducer/enquiryReducer";

const DesignerSummary = ({ onClose }) => {
  // const [designers, setDesigners] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalJobNumbers, setModalJobNumbers] = useState([]);

  const { showLoader, hideLoader } = useLoader(); 

    const dispatch = useDispatch();
  const { designerSummary, designerSummaryLoading } = useSelector((state) => state.enquiry);

  const hasFetched = React.useRef(false);

  // const fetchDesignerSummary = async () => {
  //   // showLoader();  
  //   try {
  //     const response = await axiosInstance.get(`${backendUrl}/enquiry/designersummary`);
  //     if (response.data.success) {
  //       setDesigners(response.data.data);
  //     } else {
  //       toast.error("Failed to fetch designers summary");
  //     }
  //   } catch (error) {
  //     toast.error(error.response?.data?.message || "Server error");
  //   } finally {
  //     // hideLoader(); 
  //   }
  // };

  // useEffect(() => {
  //   if (hasFetched.current) return;
  //   hasFetched.current = true;
  //   fetchDesignerSummary();
  // }, []);


  
  useEffect(() => {
    const loadSummary = async () => {
      // showLoader();
      try {
        await dispatch(fetchDesignerSummary()).unwrap();
      } catch (error) {
        toast.error(error);
      } finally {
        // hideLoader();
      }
    };
    loadSummary();
  }, [dispatch, showLoader, hideLoader]);

  const openJobNumbersModal = (title, jobNumbers) => {
    setModalTitle(title);
    setModalJobNumbers(jobNumbers);
    setModalOpen(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[80vh] overflow-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Designer Summary</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 focus:outline-none text-2xl font-bold"
          aria-label="Close Designer Summary"
        >
          &times;
        </button>
      </div>

      {designerSummary.length === 0 ? (
        <p>No designer data found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 text-sm text-left">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="px-4 py-2 border-b border-gray-300">Name</th>
                <th className="px-4 py-2 border-b border-gray-300">Total Jobs</th>
                <th className="px-4 py-2 border-b border-gray-300">Completed</th>
                <th className="px-4 py-2 border-b border-gray-300">Pending</th>
                <th className="px-4 py-2 border-b border-gray-300">Completed Job Numbers</th>
                <th className="px-4 py-2 border-b border-gray-300">Pending Job Numbers</th>
              </tr>
            </thead>
            <tbody>
              {designerSummary.map((designer) => (
                <tr key={designer.user} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-b border-gray-300">{designer.name}</td>
                  <td className="px-4 py-2 border-b border-gray-300">{designer.total}</td>
                  <td className="px-4 py-2 border-b border-gray-300">{designer.completed}</td>
                  <td className="px-4 py-2 border-b border-gray-300">{designer.pending}</td>

                  <td className="px-4 py-2 border-b border-gray-300">
                    {designer.completed_job_numbers.length > 0 ? (
                      <button
                        onClick={() => openJobNumbersModal(`${designer.name} - Completed Jobs`, designer.completed_job_numbers)}
                        className="text-blue-600 hover:underline focus:outline-none"
                        aria-label={`View completed jobs for ${designer.name}`}
                      >
                        View
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td className="px-4 py-2 border-b border-gray-300">
                    {designer.pending_job_numbers.length > 0 ? (
                      <button
                        onClick={() => openJobNumbersModal(`${designer.name} - Pending Jobs`, designer.pending_job_numbers)}
                        className="text-blue-600 hover:underline focus:outline-none"
                        aria-label={`View pending jobs for ${designer.name}`}
                      >
                        View
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <JobNumbersModal
          title={modalTitle}
          jobNumbers={modalJobNumbers}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
};

export default DesignerSummary;
