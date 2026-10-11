import React, { useState, useEffect, useCallback } from "react";
import Modal from "./Modal";
import ExitConfirmationModal from "./Exist";
import UserForm from "../../users/Form";
import DepartmentSection from "./Dept";
import { useSelector, useDispatch } from "react-redux";
import { useLoader } from "../../../context/LoaderContext";
import { toast } from "react-toastify";
import { fetchAllUsers, deleteUser, createUser, updateUser } from "../../../reducer/userReducer";
import { getAllDepartments } from "../../../reducer/departmentReducer";
import { formatDateToYYYYMMDD } from "../../../utils/enquiry/dateformat";
import { calculateAge } from "../../../utils/helper/dobCalculate";

const HRDatabase = () => {
  const { showLoader, hideLoader } = useLoader();
  const dispatch = useDispatch();

  // Redux State
  const { users } = useSelector((state) => state.user);
  const { departments } = useSelector((state) => state.department);

  // Local State
  const [activeTab, setActiveTab] = useState("Active");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [exitingEmployee, setExitingEmployee] = useState(null);

  // Fetch users and departments on mount
  const fetchUserList = useCallback(async () => {
    try {
      showLoader();
      await dispatch(fetchAllUsers({})).unwrap();
      await dispatch(getAllDepartments({})).unwrap();
    } catch (error) {
      toast.error(error?.message || "Failed to fetch users or departments");
    } finally {
      hideLoader();
    }
  }, [dispatch, showLoader, hideLoader]);

  useEffect(() => {
    fetchUserList();
  }, [fetchUserList]);

  // Transform users to employee format for the cards
  const transformUserToEmployee = (user) => {
    let joningDateFormatted = user.dob ? formatDateToYYYYMMDD(user.dob) : null;
    return {
      id: user.id || user._id,
      name: user.role?.name || "N/A", // Role name as designation
      title: user.name, // User's full name as title
      emp_id: user.emp_id || "N/A",
      doj: user.doj ? user.doj : "N/A",
      age: joningDateFormatted ? calculateAge(joningDateFormatted) : "N/A",
      phone1: user.phone_number || "N/A",
      phone2: user.emergency_number || "N/A",
      dept: user.department_id?.name || "Unknown",
      deptId: user.department_id?._id || "",
      roleId: user.role?._id || "",
      status: user.is_active ? "Active" : "Exited",
      photo: user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`,
      username: user.username,
      // Store original user data for editing
      originalUser: user
    };
  };

  // Transform all users to employees
  const employees = users.map(transformUserToEmployee);

  // Filter by active/exited
  const filteredEmployees = employees.filter((emp) => emp.status === activeTab);

  // Group by department
  const groupedEmployees = departments.reduce((acc, dept) => {
    const deptEmployees = filteredEmployees.filter(
      (emp) => emp.dept === dept.name
    );
    if (deptEmployees.length > 0) {
      acc[dept.name] = deptEmployees;
    }
    return acc;
  }, {});

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const handleExitEmployee = (employee) => {
    setExitingEmployee(employee);
    setIsExitModalOpen(true);
  };

  const confirmExitEmployee = async () => {
    try {
      showLoader();

      await dispatch(updateUser({
        id: exitingEmployee.id,
        formData: { is_active: false }
      })).unwrap();

      toast.success("Employee marked as exited");
      setIsExitModalOpen(false);
      setExitingEmployee(null);
      await fetchUserList(); // Refresh the list
    } catch (error) {
      console.error("Error exiting employee:", error);
      toast.error(error?.message || "Failed to mark employee as exited");
    } finally {
      hideLoader();
    }
  };

  const cancelExit = () => {
    setIsExitModalOpen(false);
    setExitingEmployee(null);
  };

  return (
    <div className="mt-2">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-2">
          {/* Toolbar */}
          <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
            <div className="flex gap-2 bg-gray-200 p-1 rounded-lg">
              <button
                className={`px-5 py-2 rounded-md font-semibold text-sm transition-all ${activeTab === "Active"
                  ? "bg-white text-indigo-700 shadow"
                  : "text-slate-500 hover:text-slate-700"
                  }`}
                onClick={() => setActiveTab("Active")}
              >
                Active Staff ({employees.filter(e => e.status === "Active").length})
              </button>
              <button
                className={`px-5 py-2 rounded-md font-semibold text-sm transition-all ${activeTab === "Exited"
                  ? "bg-white text-indigo-700 shadow"
                  : "text-slate-500 hover:text-slate-700"
                  }`}
                onClick={() => setActiveTab("Exited")}
              >
                Exited Employees ({employees.filter(e => e.status === "Exited").length})
              </button>
            </div>

            {/* <button 
              onClick={handleAddEmployee}
              className="px-5 py-2 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              + Add Employee
            </button> */}
          </div>

          {/* Departments */}
          {Object.keys(groupedEmployees).length === 0 ? (
            <div className="bg-white rounded-lg p-12 border border-gray-300 text-center">
              <div className="text-gray-400 text-lg mb-2">No employees found</div>
              <p className="text-gray-500 text-sm">
                {activeTab === "Active"
                  ? "Add new employees to get started"
                  : "No exited employees yet"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {Object.entries(groupedEmployees).map(([dept, emps]) => (
                <DepartmentSection
                  key={dept}
                  department={dept}
                  employees={emps}
                  onEdit={handleEditEmployee}
                  onExit={handleExitEmployee}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEmployee(null);
        }}
        title={editingEmployee ? "Edit Employee" : "Add New Employee"}
      >
        <UserForm
          userId={editingEmployee?.id}
          initialData={editingEmployee?.originalUser}
          isModal={true}
          onSuccess={() => {
            setIsModalOpen(false);
            setEditingEmployee(null);
            fetchUserList();
          }}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingEmployee(null);
          }}
        />
      </Modal>

      <ExitConfirmationModal
        isOpen={isExitModalOpen}
        onClose={cancelExit}
        onConfirm={confirmExitEmployee}
        employeeName={exitingEmployee?.title}
      />
    </div>
  );
};

export default HRDatabase;