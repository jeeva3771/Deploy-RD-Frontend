import React, { useState, useEffect, useCallback, use } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllDepartments } from '../../../reducer/departmentReducer';
import { fetchAllShiftTimes } from '../../../reducer/masters/shiftTimeReducer';
import {
    getShiftRosterOverview,
    bulkAssignShift,
    viewUserShiftDetails
} from '../../../reducer/shiftReducer';
import { toast } from "react-toastify";
import HistoryModal from "../component/ShiftHistoryModal";
import RosterControls from '../component/RosterControl';
import RosterTable from '../component/RosterTable';
import ActionButtons from '../component/Actionbutton';
import PrintableRoster from './PrintableRoster';

const ShiftRoster = () => {
    const dispatch = useDispatch();
    const { departments } = useSelector((state) => state.department);
    const { shiftTimes } = useSelector((state) => state.shiftTime);
    const { rosterData, isLoading } = useSelector((state) => state.shift);

    const [selectedDepartment, setSelectedDepartment] = useState("");
    const [selectedShift, setSelectedShift] = useState("");
    const [remarks, setRemarks] = useState("");
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedUserHistory, setSelectedUserHistory] = useState(null);

    // Load departments and shift times
    useEffect(() => {
        dispatch(getAllDepartments({ is_active: "true" }));
        dispatch(fetchAllShiftTimes({ is_active: true }));
    }, [dispatch]);

    // Auto-select first department
    useEffect(() => {
        if (departments.length > 0 && !selectedDepartment) {
            setSelectedDepartment(departments[0]._id);
        }
    }, [departments, selectedDepartment]);

    // Auto-select first shift
    useEffect(() => {
        if (shiftTimes.length > 0 && !selectedShift) {
            setSelectedShift(shiftTimes[0]._id);
        }
    }, [shiftTimes, selectedShift]);

    const loadRosterData = useCallback(async () => {
        if (!selectedDepartment) return;

        try {
            await dispatch(getShiftRosterOverview({
                department_id: selectedDepartment
            })).unwrap();
        } catch (error) {
            console.error("Failed to fetch roster data:", error);
            toast.error("Failed to load roster data");
        }
    }, [dispatch, selectedDepartment]);

    // Load roster data when department changes
    useEffect(() => {
        if (selectedDepartment) {
            loadRosterData();
        }
    }, [selectedDepartment, loadRosterData]);

    const handleToggleAll = (checked) => {
        if (checked) {
            setSelectedEmployees(rosterData.map(e => e._id));
        } else {
            setSelectedEmployees([]);
        }
    };

    const handleToggleEmployee = (empId) => {
        setSelectedEmployees(prev => {
            if (prev.includes(empId)) {
                return prev.filter(id => id !== empId);
            } else {
                return [...prev, empId];
            }
        });
    };

    const handleApplyToSelected = async () => {
        if (selectedEmployees.length === 0) {
            toast.error("Please select at least one employee");
            return;
        }

        if (!selectedShift) {
            toast.error("Please select a shift");
            return;
        }


        try {
            await dispatch(bulkAssignShift({
                department_id: selectedDepartment,
                shift_time_id: selectedShift,
                remarks: remarks.trim(),
                user_ids: selectedEmployees,
            })).unwrap();

            toast.success(`Shift assigned to ${selectedEmployees.length} employee(s)`);

            // Reload roster data
            await loadRosterData();

            setSelectedEmployees([]);
            setRemarks("");

        } catch (error) {
            console.error("Failed to assign shifts:", error);
            toast.error(error || "Failed to assign shifts");
        }
    };

    const handleViewHistory = async (employee) => {
        try {
            const result = await dispatch(viewUserShiftDetails(employee._id)).unwrap();
            setSelectedUserHistory(result.data);
            setShowHistoryModal(true);
        } catch (error) {
            console.error("Failed to fetch history:", error);
            toast.error("Failed to load shift history");
        }
    };

    const generateRosterText = () => {
        const deptName = departments.find(d => d._id === selectedDepartment)?.name || 'Department';
        const grouped = {};

        rosterData.forEach(emp => {
            const shift = emp.current_shift_time;
            const shiftKey = shift
                ? `${shift.start_time} - ${shift.end_time} (${shift.name})`
                : 'Not Assigned';

            if (!grouped[shiftKey]) grouped[shiftKey] = [];

            const remarkText = emp.remarks ? ` - ${emp.remarks}` : '';

            grouped[shiftKey].push({
                name: emp.name,
                empId: emp.emp_id,
                // remarks: remarkText
            });
        });

        let text = `*Shift Roster: ${deptName}*\nDate: ${new Date().toLocaleDateString()}\n------------------\n`;

        for (const [shift, staffList] of Object.entries(grouped)) {
            text += `\n*${shift}*\n`;
            staffList.forEach(staff => {
                text += `- ${staff.name} (${staff.empId})\n`;
            });
        }

        text += `\n------------------\nTotal: ${rosterData.length} employees`;
        return text;
    };

    const handleWhatsAppShare = () => {
        const text = encodeURIComponent(generateRosterText());
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    const handleEmailShare = () => {
        const deptName = departments.find(d => d._id === selectedDepartment)?.name || 'Department';
        const subject = encodeURIComponent(`Shift Roster - ${deptName}`);
        const body = encodeURIComponent(generateRosterText());
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = () => {
        import('jspdf').then(({ default: jsPDF }) => {
            import('jspdf-autotable').then(({ default: autoTable }) => {
                const doc = new jsPDF();

                const deptName = departments.find(d => d._id === selectedDepartment)?.name || 'Department';
                const currentDate = new Date().toLocaleDateString();

                doc.setFontSize(18);
                doc.text(`${deptName} - Shift Roster`, 14, 22);
                doc.setFontSize(11);
                doc.text(`Date: ${currentDate}`, 14, 30);

                const tableColumn = ["ID", "Employee Name", "Assigned Shift"];
                const tableRows = [];

                rosterData.forEach(emp => {
                    const shift = emp.current_shift_time;
                    const shiftText = shift
                        ? `${shift.start_time} - ${shift.end_time} (${shift.name})`
                        : 'Not Assigned';

                    const rowData = [
                        emp.emp_id,
                        emp.name,
                        shiftText
                    ];
                    tableRows.push(rowData);
                });

                autoTable(doc, {
                    head: [tableColumn],
                    body: tableRows,
                    startY: 40,
                    theme: 'grid',
                    styles: { fontSize: 10 },
                    headStyles: { fillColor: [91, 33, 182] } // Match brand color
                });

                const shiftTimeName = shiftTimes.find(s => s._id === selectedShift)?.name || 'All_Shifts';
                doc.save(`${deptName} - ${shiftTimeName}.pdf`);
            });
        });
    };

    const allSelected = rosterData.length > 0 && selectedEmployees.length === rosterData.length;

    const departmentName = departments.find(d => d._id === selectedDepartment)?.name || 'Department';
    const shiftTimeName = shiftTimes.find(s => s._id === selectedShift)?.name || '';

    return (
        <>
            <div className="flex flex-col lg:flex-row h-screen bg-gray-100 mt-2">
                {/* Sidebar - Hidden on mobile, shown on desktop */}
                {/* <div className="hidden lg:flex lg:w-64 bg-[#5b21b6] text-white flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-bold">RD CUSTOM</h1>
                </div>
                <nav className="flex-1 px-3">
                    <div className="mb-2 px-4 py-3 rounded-lg text-white/70 hover:bg-white/10 cursor-pointer flex items-center gap-3">
                        <i className="fa-solid fa-users"></i>
                        <span>Teams Builder</span>
                    </div>
                    <div className="mb-2 px-4 py-3 rounded-lg bg-white text-[#5b21b6] font-semibold cursor-pointer flex items-center gap-3">
                        <i className="fa-solid fa-clock"></i>
                        <span>Shift Roster</span>
                    </div>
                    <div className="mb-2 px-4 py-3 rounded-lg text-white/70 hover:bg-white/10 cursor-pointer flex items-center gap-3">
                        <i className="fa-solid fa-database"></i>
                        <span>HR Database</span>
                    </div>
                    <div className="mb-2 px-4 py-3 rounded-lg text-white/70 hover:bg-white/10 cursor-pointer flex items-center gap-3">
                        <i className="fa-solid fa-industry"></i>
                        <span>Production (Locked)</span>
                    </div>
                </nav>
            </div> */}

                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Header */}
                    {/* <div className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 flex items-center justify-between">
                    <h2 className="text-xl lg:text-2xl font-bold text-gray-800">SHIFT ROSTER</h2>
                    <div className="text-[#5b21b6] font-bold text-sm lg:text-base">Admin User</div>
                </div> */}

                    {/* Content Area */}
                    <div className="flex-1 overflow-auto p-4 lg:p-8">
                        {/* Controls */}
                        <RosterControls
                            departments={departments}
                            shiftTimes={shiftTimes}
                            selectedDepartment={selectedDepartment}
                            selectedShift={selectedShift}
                            remarks={remarks}
                            selectedEmployees={selectedEmployees}
                            onDepartmentChange={setSelectedDepartment}
                            onShiftChange={setSelectedShift}
                            onRemarksChange={setRemarks}
                            onApply={handleApplyToSelected}
                        />

                        {/* Table */}
                        <RosterTable
                            employees={rosterData}
                            selectedEmployees={selectedEmployees}
                            isLoading={isLoading}
                            allSelected={allSelected}
                            onToggleAll={handleToggleAll}
                            onToggleEmployee={handleToggleEmployee}
                            onViewHistory={handleViewHistory}
                        />

                        {/* Action Buttons */}
                        <ActionButtons
                            onEmail={handleEmailShare}
                            onWhatsApp={handleWhatsAppShare}
                            onPrint={handlePrint}
                            onDownloadPDF={handleDownloadPDF}
                        />
                    </div>
                </div>

                {/* History Modal */}
                {showHistoryModal && selectedUserHistory && (
                    <HistoryModal
                        userHistory={selectedUserHistory}
                        onClose={() => {
                            setShowHistoryModal(false);
                            setSelectedUserHistory(null);
                        }}
                    />
                )}

            </div>
            <PrintableRoster
                employees={rosterData}
                departmentName={departmentName}
                shiftTimeName={shiftTimeName}
            />
        </>
    );
};

export default ShiftRoster;