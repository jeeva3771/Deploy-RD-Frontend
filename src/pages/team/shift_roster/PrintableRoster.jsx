import React from 'react';

const PrintableRoster = ({ employees, departmentName, shiftTimeName }) => {
    const currentDate = new Date().toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });

    return (
        <div className="print-only hidden">
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-only, .print-only * {
                        visibility: visible;
                    }
                    .print-only {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 10px;
                        background: white;
                        display: block !important;
                    }
                    @page {
                        margin: 0.5in;
                    }
                }
            `}</style>

            <div className="max-w-4xl mx-auto bg-white">
                {/* Header */}
                {/* <div className="text-right text-xs mb-2">
                    <p>Generated: {currentDate}</p>
                </div> */}

                <div className="text-center mb-6">
                    <h1 className="text-xl font-bold mb-1">
                        {departmentName} - Shift Roster
                    </h1>
                    <p className="text-sm text-gray-600">
                        Generated: {currentDate}
                    </p>
                </div>

                {/* Table */}
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b-2 border-black">
                            <th className="text-left py-2 px-3 text-sm font-bold w-16">
                                ID
                            </th>
                            <th className="text-left py-2 px-3 text-sm font-bold">
                                EMPLOYEE NAME
                            </th>
                            {/* <th className="text-left py-2 px-3 text-sm font-bold w-32">
                                RANK
                            </th> */}
                            <th className="text-center py-2 px-3 text-sm font-bold w-40">
                                ASSIGNED SHIFT
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map((employee, index) => {
                            const shift = employee.current_shift_time;
                            return (
                                <tr 
                                    key={employee._id}
                                    className="border-b border-gray-200"
                                >
                                    <td className="py-2 px-3 text-sm">
                                        {employee.emp_id}
                                    </td>
                                    <td className="py-2 px-3 text-sm font-semibold">
                                        {employee.name}
                                    </td>
                                    {/* <td className="py-2 px-3 text-sm">
                                        {employee.rank || employee.designation || 'Operator'}
                                    </td> */}
                                    <td className="py-2 px-3 text-center">
                                        {shift ? (
                                            <div className="inline-block border border-gray-400 rounded-full px-3 py-1">
                                                <div className="text-xs font-semibold">
                                                    {shift.start_time} - {shift.end_time}
                                                </div>
                                                <div className="text-[10px] text-gray-600">
                                                    {shift.name}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400">—</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PrintableRoster;