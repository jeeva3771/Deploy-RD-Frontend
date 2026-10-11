import React from "react";
import CloseIcon from "@mui/icons-material/Close";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

const DesignerFileUploadModal = ({
  open,
  files,
  onClose,
  onFileChange,
  onRemoveFile,
  onSubmit,
  loading
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 relative animate-fadeIn">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <UploadFileIcon /> Upload Files
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded"
            disabled={loading}
          >
            <CloseIcon />
          </button>
        </div>

        {/* File Input */}
        <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded cursor-pointer hover:bg-gray-50 transition">
          <UploadFileIcon className="text-gray-500" />
          <span className="text-sm text-gray-600">Select files</span>
          <input type="file" multiple onChange={onFileChange} className="hidden" disabled={loading} />
        </label>

        {/* File List */}
        <div className="mt-4 max-h-40 overflow-y-auto space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-2 bg-gray-100 rounded"
            >
              <span className="flex items-center gap-2">
                <UploadFileIcon fontSize="small" />
                {file.name}
              </span>

              <button
                className="text-red-600 hover:text-red-800"
                onClick={() => onRemoveFile(index)}
                disabled={loading}
              >
                <DeleteOutlineIcon fontSize="small" />
              </button>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-50 transition"
            disabled={loading}
          >
            Cancel
          </button>
            <button
            onClick={onSubmit}
            disabled={loading}
            className={`px-4 py-2 text-white rounded transition ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
            >
            {loading ? "Uploading..." : "Submit"}
            </button>
        </div>
      </div>
    </div>
  );
};

export default DesignerFileUploadModal;
