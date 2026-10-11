import React from "react";

const JobNumbersModal = ({ title, jobNumbers, onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[80vh] overflow-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold capitalize">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 text-2xl font-bold leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {jobNumbers.length === 0 ? (
          <p className="text-center text-gray-500">No job numbers available.</p>
        ) : (
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            {jobNumbers.map((job) => (
              <li key={job} className="break-words">
                {job}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default JobNumbersModal;
