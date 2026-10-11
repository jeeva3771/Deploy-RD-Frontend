import React from 'react';

const ActionButtons = ({ onEmail, onWhatsApp, onPrint }) => {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="text-sm text-gray-600">
                    {/* <i className="fa-solid fa-share-nodes mr-2"></i>
                    Share or print the current roster */}
                </div>
                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                    <button
                        onClick={onEmail}
                        className="flex-1 sm:flex-none px-4 lg:px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded flex items-center justify-center gap-2 transition-colors"
                    >
                        <i className="fa-solid fa-envelope"></i>
                        <span className="hidden sm:inline">Email Roster</span>
                        <span className="sm:hidden">Email</span>
                    </button>
                    <button
                        onClick={onWhatsApp}
                        className="flex-1 sm:flex-none px-4 lg:px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded flex items-center justify-center gap-2 transition-colors"
                    >
                        <i className="fa-brands fa-whatsapp"></i>
                        <span className="hidden sm:inline">WhatsApp Roster</span>
                        <span className="sm:hidden">WhatsApp</span>
                    </button>
                    <button
                        onClick={onPrint}
                        className="flex-1 sm:flex-none px-4 lg:px-6 py-2.5 bg-[#5b21b6] hover:bg-[#4c1d95] text-white font-semibold rounded flex items-center justify-center gap-2 transition-colors"
                    >
                        <i className="fa-solid fa-print"></i>
                        <span className="hidden sm:inline">Print Roster</span>
                        <span className="sm:hidden">Print</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActionButtons;