import React, { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchAllUsers } from "../../reducer/userReducer";
import {
  fetchAllDTPJobs,
  clearDTPChangeFlag,
  fetchDTPJobById,
} from "../../reducer/dtpStudioReducer";
import ProfileImage from "../users/ProfileImage";
import DtpKanbanBoard from "./components/DtpKanbanBoard";
import ShopFloorView from "./components/ShopFloorView";
import JobDetailsPanel from "./components/JobDetailsPanel";
import {
  getUser,
  getUserRole,
  getUserPermissions,
} from "../../utils/permission/auth";
import { Loader2 } from "lucide-react";

const DtpDashboard = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { users } = useSelector((state) => state.user);
  const { jobs: dtpJobs, loading } = useSelector((state) => state.dtpStudio);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [openToHistory, setOpenToHistory] = useState(false);
  const userRole = getUserRole()?.toLowerCase();
  const currentUser = getUser();

  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState("kanban");
  const [showDueToday, setShowDueToday] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(null); // null, 'qty', 'date'
  const qtyDropdownRef = useRef(null);
  const dateDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        activeDropdown === "qty" &&
        qtyDropdownRef.current &&
        !qtyDropdownRef.current.contains(event.target)
      ) {
        setActiveDropdown(null);
      }
      if (
        activeDropdown === "date" &&
        dateDropdownRef.current &&
        !dateDropdownRef.current.contains(event.target)
      ) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeDropdown]);

  const isArtistView =
    userRole === "admin executive" ||
    (userRole === "client servicing manager" && currentUser?.is_head) ||
    (userRole === "dtp operator" && currentUser?.is_head) ||
    (userRole === "dtp head" && currentUser?.is_head);

  // const isNotHead = (userRole === 'client servicing executive' || userRole === 'dtp operator') && !currentUser?.is_head;

  useEffect(() => {
    dispatch(fetchAllUsers({ departmentName: "DTP", is_active: true }));
    dispatch(fetchAllDTPJobs());
  }, [dispatch]);

  const handleUserClick = (user) => {
    if (selectedUser?.id === user.id) {
      setSelectedUser(null);
    } else {
      setSelectedUser(user);
    }
  };

  const handleOpenJob = useCallback((id, history = false) => {
    const job = dtpJobs?.find((j) => j._id === id || j.id === id);
    setSelectedJobId(id);
    setIsDetailsOpen(true);
    setOpenToHistory(history);
    setActiveDropdown(null);
    dispatch(fetchDTPJobById(id));

    if (job) {
      const isSupervisor =
        userRole === "admin executive" || currentUser?.is_head;
      const isAssigned =
        job.assigned_to === currentUser?._id ||
        job.assigned_to?._id === currentUser?._id;
      const isUnassigned = !job.assigned_to;

      // Clear flags if:
      // 1. Current user is the assigned designer
      // 2. Job is unassigned and current user is Admin/Head
      if (isAssigned || (isUnassigned && isSupervisor)) {
        if (job.is_qty_changed)
          dispatch(clearDTPChangeFlag({ id, type: "qty" }));
        if (job.is_date_changed)
          dispatch(clearDTPChangeFlag({ id, type: "date" }));
      }
    }
  }, [currentUser?._id, currentUser?.is_head, dispatch, dtpJobs, userRole]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const queryJobId = queryParams.get("jobId");
    const stateJobId = location.state?.openJobId;
    const targetJobId = queryJobId || stateJobId;

    if (targetJobId && dtpJobs && dtpJobs.length > 0) {
      const job = dtpJobs.find(
        (j) =>
          j._id === targetJobId ||
          j.id === targetJobId ||
          j.sub_job_no === targetJobId,
      );
      if (job) {
        const targetId = job._id || job.id;
        if (selectedJobId !== targetId) {
          handleOpenJob(targetId);
          navigate("/dtp-studio", { replace: true, state: {} });
        }
      }
    }
  }, [
    location.search,
    location.state,
    dtpJobs,
    selectedJobId,
    handleOpenJob,
    navigate,
  ]);

  const filteredJobs = React.useMemo(() => {
    if (!dtpJobs) return [];
    let filtered = [...dtpJobs];
    const permissions = getUserPermissions();

    // Sales Person restricted view: Only see jobs created by them OR for enquiries they created
    if (
      permissions.includes("9") &&
      !currentUser?.is_head &&
      userRole !== "admin executive"
    ) {
      filtered = filtered.filter((job) => {
        const jobCreatedBy =
          typeof job.created_by === "object"
            ? job.created_by?._id
            : job.created_by;
        const enq = job.enquiry_id;
        const enquiryCreatedBy =
          typeof enq?.created_by === "object"
            ? enq?.created_by?._id
            : enq?.created_by;
        return (
          jobCreatedBy === currentUser?._id ||
          enquiryCreatedBy === currentUser?._id
        );
      });
    }

    // DTP Operator restricted view: Only see jobs assigned to them OR created by them
    if (userRole === "dtp operator" && !currentUser?.is_head) {
      filtered = filtered.filter((job) => {
        const isAssigned =
          job.assigned_to === currentUser?._id ||
          job.assigned_to?._id === currentUser?._id;
        const jobCreatedBy =
          typeof job.created_by === "object"
            ? job.created_by?._id
            : job.created_by;
        return isAssigned || jobCreatedBy === currentUser?._id;
      });
    }

    if (showDueToday) {
      const todayStr = new Date().toISOString().split("T")[0];
      filtered = filtered.filter((job) => {
        const compDate =
          (job.job_completion_date && job.job_completion_date.split("T")[0]) ||
          (job.delivery_date && typeof job.delivery_date === "string"
            ? job.delivery_date.split("T")[0]
            : null);
        return compDate === todayStr;
      });
    }

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          (job.job_no && job.job_no.toLowerCase().includes(s)) ||
          (job.sub_job_no && job.sub_job_no.toLowerCase().includes(s)) ||
          (job.job_name && job.job_name.toLowerCase().includes(s)) ||
          (job.client_name && job.client_name.toLowerCase().includes(s)) ||
          (job.product_name && job.product_name.toLowerCase().includes(s)) ||
          (job.enquiry_id?.reference_no &&
            String(job.enquiry_id.reference_no).toLowerCase().includes(s)),
      );
    }

    return filtered;
  }, [dtpJobs, showDueToday, searchTerm, currentUser, userRole]);

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-50 h-[calc(100vh-90px)] mt-2">
      <div className="relative bg-white border-b border-slate-200 px-6 py-4 flex flex-col gap-4 shadow-sm z-30 shrink-0">
        {/* Header Row */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              Head Command Center
            </h1>

            {/* Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("kanban")}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  activeTab === "kanban"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setActiveTab("shop_floor")}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  activeTab === "shop_floor"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Shop Floor View
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input
                type="text"
                placeholder="Search Job / Sub-Job..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-600 w-64 transition-all outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <i className="fa-solid fa-xmark text-xs"></i>
                </button>
              )}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-4">
            {(() => {
              const isSupervisor =
                userRole === "admin executive" || currentUser?.is_head;
              const qtyChangeJobs =
                dtpJobs?.filter((j) => j.is_qty_changed) || [];
              const dateChangeJobs =
                dtpJobs?.filter((j) => j.is_date_changed) || [];

              const myQtyChanges = isSupervisor
                ? qtyChangeJobs
                : qtyChangeJobs.filter(
                    (j) =>
                      j.assigned_to === currentUser?._id ||
                      j.assigned_to?._id === currentUser?._id,
                  );
              const myDateChanges = isSupervisor
                ? dateChangeJobs
                : dateChangeJobs.filter(
                    (j) =>
                      j.assigned_to === currentUser?._id ||
                      j.assigned_to?._id === currentUser?._id,
                  );

              const qtyCount = myQtyChanges.length;
              const dateCount = myDateChanges.length;

              return (
                <>
                  <div className="relative" ref={qtyDropdownRef}>
                    <button
                      onClick={() =>
                        setActiveDropdown(
                          activeDropdown === "qty" ? null : "qty",
                        )
                      }
                      className={`text-white text-sm font-bold py-2 px-4 rounded flex items-center shadow-sm transition-colors ${
                        activeDropdown === "qty"
                          ? "bg-purple-800 ring-2 ring-purple-300"
                          : "bg-purple-600 hover:bg-purple-700"
                      } ${qtyCount > 0 ? "animate-pulse" : ""}`}
                      disabled={qtyCount === 0}
                    >
                      <i className="fa-solid fa-pen-to-square mr-2"></i>
                      QTY CHANGE ({qtyCount})
                    </button>

                    {activeDropdown === "qty" && qtyCount > 0 && (
                      <div className="absolute top-full right-0 mt-2 w-64 bg-white border-2 border-purple-500 rounded-lg shadow-xl z-50 overflow-hidden">
                        <div className="p-3 border-b border-purple-100 bg-purple-50">
                          <h3 className="font-bold text-purple-800 text-sm">
                            Quantity Changes
                          </h3>
                        </div>
                        <div className="max-h-[380px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50 scroll-smooth">
                          {myQtyChanges.map((job) => (
                            <div
                              key={job._id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenJob(job._id);
                                setActiveDropdown(null);
                              }}
                              className="p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                            >
                              <div className="text-xs font-bold text-slate-700">
                                {job.sub_job_no || job.job_no}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">
                                {job.client_name || job.product_name}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative" ref={dateDropdownRef}>
                    <button
                      onClick={() =>
                        setActiveDropdown(
                          activeDropdown === "date" ? null : "date",
                        )
                      }
                      className={`text-white text-sm font-bold py-2 px-4 rounded flex items-center shadow-sm transition-colors ${
                        activeDropdown === "date"
                          ? "bg-orange-700 ring-2 ring-orange-200"
                          : "bg-orange-500 hover:bg-orange-600"
                      } ${dateCount > 0 ? "animate-pulse" : ""}`}
                      disabled={dateCount === 0}
                    >
                      <i className="fa-solid fa-calendar-day mr-2"></i>
                      DATE CHANGE ({dateCount})
                    </button>

                    {activeDropdown === "date" && dateCount > 0 && (
                      <div className="absolute top-full right-0 mt-2 w-64 bg-white border-2 border-orange-500 rounded-lg shadow-xl z-50 overflow-hidden">
                        <div className="p-3 border-b border-orange-100 bg-orange-50">
                          <h3 className="font-bold text-orange-800 text-sm">
                            Preponed Jobs
                          </h3>
                        </div>
                        <div className="max-h-[380px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50 scroll-smooth">
                          {myDateChanges.map((job) => (
                            <div
                              key={job._id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenJob(job._id);
                                setActiveDropdown(null);
                              }}
                              className="p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                            >
                              <div className="text-xs font-bold text-slate-700">
                                {job.sub_job_no || job.job_no}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">
                                {job.client_name || job.product_name}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}

            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded border border-slate-200 hover:border-slate-300 transition-colors">
              <input
                type="checkbox"
                checked={showDueToday}
                onChange={(e) => setShowDueToday(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700">
                Due Today
              </span>
            </label>
            {/* Role Toggle for Admin & Head */}
            {/* {(userRole === 'admin') && (
                            <div className="flex bg-slate-100 p-1 rounded-lg mr-4">
                                <button
                                    onClick={() => setRoleView("HEAD")}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${roleView === "HEAD"
                                        ? "bg-white text-blue-600 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
                                        }`}
                                >
                                    HEAD
                                </button>
                                <button
                                    onClick={() => setRoleView("ARTIST")}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${roleView === "ARTIST"
                                        ? "bg-white text-blue-600 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
                                        }`}
                                >
                                    ARTIST
                                </button>
                            </div>
                        )} */}
          </div>
        </div>

        {/* User Filter Row */}
        {activeTab === "kanban" && isArtistView && (
          <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">
              Filter:
            </span>
            <button
              onClick={() => setSelectedUser(null)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition whitespace-nowrap cursor-pointer ${
                !selectedUser
                  ? "bg-slate-900 border-slate-900 text-white font-medium"
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
              }`}
            >
              All Artists
            </button>
            {users.map((user) => {
              const isActive = selectedUser?.id === user.id;
              return (
                <button
                  key={user.id}
                  onClick={() => handleUserClick(user)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-white border-slate-400 text-slate-800 font-medium"
                      : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                  }`}
                >
                  <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center border border-slate-200">
                    <ProfileImage
                      src={user.image}
                      alt={user.first_name || user.name}
                      name={user.first_name || user.name}
                      size="default"
                    />
                  </div>
                  {user.first_name || user.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden relative h-full">
        {loading ? (
          <div className="h-full w-full flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm rounded-[2rem] border border-slate-200">
            <Loader2 className="w-12 h-12 text-cyan-600 animate-spin mb-4" />
            <p className="text-xs font-[1000] text-slate-500 uppercase tracking-widest animate-pulse">
              Loading Jobs...
            </p>
          </div>
        ) : activeTab === "kanban" ? (
          <DtpKanbanBoard
            selectedUser={selectedUser}
            newJobs={filteredJobs}
            currentUser={currentUser}
            userRole={userRole}
            onOpenDetails={handleOpenJob}
          />
        ) : (
          <ShopFloorView
            jobs={filteredJobs}
            currentUser={currentUser}
            userRole={userRole}
            onOpenDetails={handleOpenJob}
          />
        )}
      </div>

      {isDetailsOpen && selectedJobId && (
        <JobDetailsPanel
          job={dtpJobs.find((j) => (j._id || j.id) === selectedJobId)}
          isOpen={isDetailsOpen}
          initialShowHistory={openToHistory}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedJobId(null);
            setOpenToHistory(false);
          }}
          currentUser={currentUser}
          userRole={userRole}
        />
      )}
    </div>
  );
};

export default DtpDashboard;
