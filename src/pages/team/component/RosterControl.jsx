import { Select, MenuItem } from "@mui/material";
import { useRef, useEffect } from "react";
const RosterControls = ({
    departments,
    shiftTimes,
    selectedDepartment,
    selectedShift,
    remarks,
    selectedEmployees,
    onDepartmentChange,
    onShiftChange,
    onRemarksChange,
    onApply
}) => {
    const textareaRef = useRef(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [remarks]);
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 items-end">
                {/* Department Select */}
                <div className="flex flex-col gap-2">
                    <label className="block text-sm font-semibold text-gray-600">
                        Department Select
                    </label>
                    {/* <select
                        value={selectedDepartment}
                        onChange={(e) => onDepartmentChange(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
                    >
                        {departments.map((dept) => (
                            <option key={dept._id} value={dept._id}>
                                {dept.name}
                            </option>
                        ))}
                    </select> */}
                     <Select
                        value={selectedDepartment || ""}
                        onChange={(e) => onDepartmentChange(e.target.value)}
                        displayEmpty
                        fullWidth
                        size="small"
                        className="w-full"
                    >
                        <MenuItem value="">
                        <span className="text-gray-400">Select department</span>
                        </MenuItem>

                        {departments.map((dept) => (
                        <MenuItem key={dept._id} value={dept._id}>
                            {dept.name}
                        </MenuItem>
                        ))}
                    </Select>
                </div>

                {/* Bulk Assign Shift */}
                <div className="flex flex-col gap-2">
                    <label className="block text-sm font-semibold text-gray-600">
                        Bulk Assign Shift
                    </label>
                    {/* <select
                        value={selectedShift}
                        onChange={(e) => onShiftChange(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
                    >
                        {shiftTimes.map((shift) => (
                            <option key={shift._id} value={shift._id}>
                                {shift.start_time} - {shift.end_time} ({shift.name})
                            </option>
                        ))}
                    </select> */}
                    <Select
                        value={selectedShift || ""}
                        onChange={(e) => onShiftChange(e.target.value)}
                        displayEmpty
                        fullWidth
                        size="small"
                        className="w-full"
                    >
                        <MenuItem value="">
                        <span className="text-gray-400">Select shift time</span>
                        </MenuItem>

                        {shiftTimes.map((shift) => (
                        <MenuItem key={shift._id} value={shift._id}>
                            {shift.start_time} - {shift.end_time} ({shift.name})
                        </MenuItem>
                        ))}
                    </Select>
                </div>

                {/* Remarks Input */}
                <div className="flex flex-col gap-2">
                    <label className="block text-sm font-semibold text-gray-600">
                        Remarks (Optional)
                    </label>
                    <textarea
                        ref={textareaRef}
                        value={remarks}
                        onChange={(e) => onRemarksChange(e.target.value)}
                        placeholder="Add assignment remarks..."
                        rows="1"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300
                            focus:ring-2 focus:ring-blue-300 focus:border-blue-500 
                            outline-none transition resize-none overflow-hidden
                            min-h-[42px] max-h-32"
                    />
                </div>

                {/* Apply Button */}
                <button
                    onClick={onApply}
                    disabled={selectedEmployees.length === 0}
                    className="px-6 py-2 bg-[#5b21b6] hover:bg-[#4c1d95] text-white font-semibold rounded transition-colors h-[42px]"
                       
                >
                    <span >Apply to Selected ({selectedEmployees.length})</span>
                </button>
            </div>
        </div>
    );
};

export default RosterControls;