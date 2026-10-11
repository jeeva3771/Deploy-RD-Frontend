import { getShiftBadgeClass } from '../../../utils/shiftUtils';

const HistoryModal = ({ userHistory, onClose }) => {

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#5b21b6] to-[#7c3aed] px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-shrink-0">
                    <div className="text-white flex-1 min-w-0">
                        <div className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                            Employee Shift History
                        </div>
                        <div className="text-xs sm:text-sm text-purple-200 mt-1">
                            Complete assignment timeline
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white/20 rounded-full p-1.5 sm:p-2 transition-colors flex-shrink-0 ml-2"
                        aria-label="Close modal"
                    >
                        <i className="fa-solid fa-times text-lg sm:text-xl"></i>
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Employee Details */}
                    <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            <div>
                                <span className="text-xs text-gray-500 uppercase tracking-wide block mb-1">
                                    Employee Name
                                </span>
                                <p className="font-semibold text-gray-800 text-base sm:text-lg break-words">
                                    {userHistory.name}
                                </p>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 uppercase tracking-wide block mb-1">
                                    Employee ID
                                </span>
                                <p className="font-mono font-semibold text-gray-800 text-base sm:text-lg">
                                    {userHistory.emp_id}
                                </p>
                            </div>
                            <div className="sm:col-span-2 lg:col-span-1">
                                <span className="text-xs text-gray-500 uppercase tracking-wide block mb-1">
                                    Department
                                </span>
                                <p className="font-semibold text-gray-800 text-base sm:text-lg break-words">
                                    {userHistory.department?.name || 'N/A'}
                                </p>
                            </div>
                        </div>

                        {/* This is Current Shift */}
                        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-300">
                            <span className="text-xs text-gray-500 uppercase tracking-wide block mb-2">
                                Current Shift
                            </span>
                            {userHistory.current_shift ? (
                                <div className={`inline-flex flex-wrap items-center gap-2 px-3 sm:px-4 py-2 rounded-lg ${getShiftBadgeClass(userHistory.current_shift)}`}>
                                    <i className="fa-solid fa-clock"></i>
                                    <span className="font-semibold text-sm sm:text-base">
                                        {userHistory.current_shift.start_time} - {userHistory.current_shift.end_time}
                                    </span>
                                    <span className="text-xs sm:text-sm">
                                        ({userHistory.current_shift.name})
                                    </span>
                                </div>
                            ) : (
                                <span className="text-gray-400 italic text-sm">No shift assigned</span>
                            )}
                        </div>
                    </div>

                    {/* History Timeline */}
                    <div className="px-4 sm:px-6 py-4 sm:py-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800">
                                Assignment History
                            </h3>
                            <span className="text-xs sm:text-sm text-gray-500">
                                {userHistory.assignment_history?.length || 0} record(s)
                            </span>
                        </div>

                        {!userHistory.assignment_history || userHistory.assignment_history.length === 0 ? (
                            <div className="text-center py-8 sm:py-12 text-gray-500">
                                <i className="fa-solid fa-inbox text-3xl sm:text-4xl mb-3 text-gray-300"></i>
                                <p className="text-sm sm:text-base">No assignment history available</p>
                            </div>
                        ) : (
                            <div className="space-y-3 sm:space-y-4">
                                {userHistory.assignment_history.map((record, index) => (
                                    <div
                                        key={index}
                                        className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                                            {/* Left Side - Shift Details */}
                                            <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                                                <div className="bg-[#5b21b6] text-white rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                                        <i className="fa-solid fa-clock text-blue-600 text-sm"></i>
                                                        <span className="font-semibold text-gray-800 text-sm sm:text-base">
                                                            {record.shift_time?.start_time} - {record.shift_time?.end_time}
                                                        </span>
                                                        <span className="text-xs sm:text-sm text-gray-600">
                                                            ({record.shift_time?.name})
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
                                                        <i className="fa-solid fa-building text-purple-600 text-xs"></i>
                                                        <span className="text-xs sm:text-sm text-gray-600 break-words">
                                                            {record.department?.name || 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Side - Date */}
                                            <div className="text-left sm:text-right flex-shrink-0 pl-9 sm:pl-0">
                                                <div className="text-xs text-gray-500 mb-1">
                                                    <i className="fa-solid fa-calendar-alt mr-1"></i>
                                                    Assigned On
                                                </div>
                                                <div className="text-xs sm:text-sm font-semibold text-gray-700 break-words">
                                                    {record.assigned_at}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Remarks */}
                                        {record.remarks && (
                                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2.5 sm:p-3 rounded mt-3">
                                                <div className="flex items-start gap-2">
                                                    <i className="fa-solid fa-comment-dots text-yellow-600 mt-0.5 sm:mt-1 flex-shrink-0 text-sm"></i>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-xs text-yellow-700 font-semibold uppercase block mb-1">
                                                            Remarks
                                                        </span>
                                                        <p className="text-xs sm:text-sm text-gray-700 italic break-words whitespace-pre-wrap">
                                                            "{record.remarks}"
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Assigned By */}
                                        {record.assigned_by && (
                                            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
                                                <i className="fa-solid fa-user-tie"></i>
                                                <span>Assigned by:</span>
                                                <span className="font-semibold break-words">
                                                    {record.assigned_by.name}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-end flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded transition-colors text-sm sm:text-base"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HistoryModal;