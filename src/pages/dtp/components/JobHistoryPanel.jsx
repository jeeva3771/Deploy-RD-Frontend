import React, { useRef } from 'react';


const JobHistoryPanel = ({ history = [], jobNo, clientName, onHide, hideClose = false }) => {
    const printRef = useRef();

    const handlePrintByIframe = () => {
        const printContent = printRef.current;
        const printWindow = window.open('', '_blank');

        // Build the HTML for the print window to match the app's look
        printWindow.document.write(`
            <html>
                <head>
                    <title>Audit Log - ${jobNo}</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
                    <style>
                        @page { size: auto; margin: 20mm; }
                        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background-color: #f8fafc; color: #64748b; font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e2e8f0; }
                        td { border-bottom: 1px solid #f1f5f9; padding: 12px 24px; color: #475569; font-size: 14px; }
                        .badge { padding: 4px 12px; border-radius: 4px; font-weight: 700; font-size: 10px; text-transform: uppercase; border-width: 1px; }
                        .badge-system { background-color: #eff6ff; color: #2563eb; border-color: #dbeafe; }
                        .badge-head { background-color: #faf5ff; color: #9333ea; border-color: #f3e8ff; }
                    </style>
                </head>
                <body>
                    <div style="padding: 20px;">
                        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 20px;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <h1 style="font-size: 24px; font-weight: 700; color: #1e293b; margin: 0;">Audit Log: ${jobNo}</h1>
                            </div>
                            <div style="color: #64748b; font-size: 12px;">Generated on: ${new Date().toLocaleString()}</div>
                        </div>
                        ${printContent.innerHTML}
                    </div>
                    <script>
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                                window.close();
                            }, 500);
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* History Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <i className="fa-solid fa-clock-rotate-left text-xl text-indigo-600"></i>
                    <h2 className="text-xl font-bold text-slate-800">Audit Log: {jobNo}</h2>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handlePrintByIframe}
                        className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors text-sm font-medium shadow-sm"
                    >
                        <i className="fa-solid fa-print"></i>
                        Print History
                    </button>
                    {!hideClose && (
                        <button
                            onClick={onHide}
                            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium"
                        >
                            <i className="fa-solid fa-times"></i>
                            Close
                        </button>
                    )}
                </div>
            </div>

            {/* History Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                <div ref={printRef} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Time</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">User</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action / Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {history.length > 0 ? (
                                [...history].reverse().map((entry, index) => {
                                    const userName = entry.is_client_approval ? (clientName || 'Client') : (entry.user?.name || entry.user || 'System');
                                    const isSystem = userName.toLowerCase() === 'system';

                                    return (
                                        <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                                                {(() => {
                                                    if (!entry.date) return '-';
                                                    const d = new Date(entry.date);
                                                    return isNaN(d.getTime()) ? entry.date : d.toLocaleString('en-GB');
                                                })()}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`badge ${isSystem ? 'badge-system' : 'badge-head'}`}>
                                                    {isSystem ? 'System' : userName}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {!isSystem && <div className="w-2 h-2 rounded-full bg-slate-200"></div>}
                                                    <span className="text-sm font-medium text-slate-700">
                                                        {entry.action === 'Created' ? 'Job Created' : `${entry.description}`}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="3" className="px-6 py-12 text-center text-slate-400 italic text-sm">
                                        No history entries found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default JobHistoryPanel;

