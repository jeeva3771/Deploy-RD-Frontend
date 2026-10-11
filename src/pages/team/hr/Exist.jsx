import React from "react";
import Modal from "./Modal";

const ExitConfirmationModal = ({ isOpen, onClose, onConfirm, employeeName }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Employee Exit">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-red-900 mb-1">
              Warning: Permanent Action
            </h3>
            <p className="text-sm text-red-700">
              Are you sure you want to mark{" "}
              <span className="font-semibold">{employeeName}</span> as exited?
              This will move them to "Exited Employees" tab.
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2.5 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Yes, Mark as Exited
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ExitConfirmationModal;