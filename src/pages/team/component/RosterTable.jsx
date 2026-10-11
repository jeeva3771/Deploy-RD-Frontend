import React from 'react';
import { getShiftBadgeClass } from '../../../utils/shiftUtils';

const RosterTable = ({
    employees,
    selectedEmployees,
    isLoading,
    allSelected,
    onToggleAll,
    onToggleEmployee,
    onViewHistory
}) => {

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="w-12 px-6 py-3 text-left">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={(e) => onToggleAll(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-[#5b21b6] focus:ring-[#5b21b6] cursor-pointer"
                                />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                Employee Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                Assigned Shift
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                Remarks
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                Assigned Time
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {isLoading ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                    <i className="fa-solid fa-spinner fa-spin text-2xl mb-2"></i>
                                    <p>Loading employees...</p>
                                </td>
                            </tr>
                        ) : employees.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                    No employees found
                                </td>
                            </tr>
                        ) : (
                            employees.map((employee) => {
                                const isSelected = selectedEmployees.includes(employee._id);
                                const shift = employee.current_shift_time;
                                const latestAssignment = employee.shift_assignment_history?.[0];
                                return (
                                    <tr
                                        key={employee._id}
                                        className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                                    >
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => onToggleEmployee(employee._id)}
                                                className="w-4 h-4 rounded border-gray-300 text-[#5b21b6] focus:ring-[#5b21b6] cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                                            {employee.emp_id}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                                            {employee.name}
                                        </td>
                                        <td className="px-6 py-4">
                                            {shift ? (
                                                <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-semibold ${getShiftBadgeClass(shift)}`}>
                                                    {shift.start_time} - {shift.end_time} ({shift.name})
                                                </span>
                                            ) : (
                                                <span className="text-sm text-gray-400 italic">Not assigned</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 max-w-[300px] truncate">
                                            {employee?.remarks ? (
                                                <span className="italic text-gray-700">"{employee.remarks}"</span>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {employee?.assigned_at ? (
                                                <span className="text-gray-700">{employee.assigned_at}</span>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => onViewHistory(employee)}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded transition-colors"
                                            >
                                                <i className="fa-solid fa-eye"></i>
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-gray-200">
                {isLoading ? (
                    <div className="px-6 py-12 text-center text-gray-500">
                        <i className="fa-solid fa-spinner fa-spin text-2xl mb-2"></i>
                        <p>Loading employees...</p>
                    </div>
                ) : employees.length === 0 ? (
                    <div className="px-6 py-12 text-center text-gray-500">
                        No employees found
                    </div>
                ) : (
                    employees.map((employee) => {
                        const isSelected = selectedEmployees.includes(employee._id);
                        const shift = employee.current_shift_time;
                        const latestAssignment = employee.shift_assignment_history?.[0];

                        return (
                            <div
                                key={employee._id}
                                className={`p-4 ${isSelected ? 'bg-blue-50' : ''}`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-start gap-3 flex-1">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => onToggleEmployee(employee._id)}
                                            className="w-4 h-4 rounded border-gray-300 text-[#5b21b6] focus:ring-[#5b21b6] cursor-pointer mt-1"
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-800 text-base">
                                                {employee.name}
                                            </h3>
                                            <p className="text-sm text-gray-600 font-mono mt-1">
                                                ID: {employee.emp_id}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 ml-7">
                                    <div>
                                        <span className="text-xs text-gray-500 block mb-1">Shift:</span>
                                        {shift ? (
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getShiftBadgeClass(shift)}`}>
                                                {shift.start_time} - {shift.end_time} ({shift.name})
                                            </span>
                                        ) : (
                                            <span className="text-sm text-gray-400 italic">Not assigned</span>
                                        )}
                                    </div>

                                    {latestAssignment?.remarks && (
                                        <div>
                                            <span className="text-xs text-gray-500 block mb-1">Remarks:</span>
                                            <p className="text-sm italic text-gray-700">
                                                "{latestAssignment.remarks}"
                                            </p>
                                        </div>
                                    )}

                                    {latestAssignment?.assigned_at && (
                                        <div>
                                            <span className="text-xs text-gray-500 block mb-1">Assigned:</span>
                                            <p className="text-sm text-gray-600">
                                                {latestAssignment.assigned_at}
                                            </p>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => onViewHistory(employee)}
                                        className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded transition-colors"
                                    >
                                        <i className="fa-solid fa-eye"></i>
                                        View Full History
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default RosterTable;