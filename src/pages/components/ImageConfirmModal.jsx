import React from "react";

export default function ImageConfirmModal({
  open,
  onClose,
  onConfirm,
  previousImages = [],
  previousImageNames = [],
  newImage,
  confirmLoading = false,
}) {
  if (!open) return null;


  const scrollStyle = {
    display: "flex",
    overflowX: "scroll",
    overflowY: "hidden",
    maxWidth: "100%",
    paddingBottom: "8px",
    scrollbarWidth: "thin", 
    scrollbarColor: "#888 #f0f0f0", 
  };

  const imageWrapperStyle = {
    flex: "0 0 auto",
    marginRight: "8px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-5 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">

        {/* Custom scrollbar for Webkit browsers */}
        <style>
          {`
            .previous-images-scroll::-webkit-scrollbar {
              height: 8px; /* horizontal scrollbar height */
            }
            .previous-images-scroll::-webkit-scrollbar-track {
              background: #f0f0f0;
              border-radius: 4px;
            }
            .previous-images-scroll::-webkit-scrollbar-thumb {
              background-color: #888;
              border-radius: 4px;
              border: 2px solid #f0f0f0;
            }
            .previous-images-scroll::-webkit-scrollbar-thumb:hover {
              background-color: #555;
            }
          `}
        </style>

        <h2 className="text-xl font-bold mb-4">Confirm Image Upload</h2>

        {/* Previous Images Section */}
        {previousImages.length > 0 && (
          <>
            <p className="font-medium mb-2">Previously Uploaded:</p>

            <div
              className="previous-images-scroll mb-4"
              style={scrollStyle}
            >
              {previousImages.map((img, i) => (
                <div key={i} style={imageWrapperStyle}>
                  <img
                    src={img}
                    alt={previousImageNames[i] || ""}
                    className="w-24 h-24 object-cover rounded border"
                  />
                  {previousImageNames[i] && (
                    <span className="text-xs mt-1 break-all text-center">
                      {previousImageNames[i]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* New Image Section */}
        <p className="font-medium mb-2">New Image:</p>

        {newImage && (
          <div className="flex flex-col items-center mb-4">
            <img
              src={URL.createObjectURL(newImage)}
              alt=""
              className="w-full h-48 object-cover rounded border"
            />
            <span className="text-sm mt-2 font-medium break-all text-center">
              {newImage.name}
            </span>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            disabled={confirmLoading}
            className="px-4 py-2 bg-gray-300 rounded-md disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={confirmLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {confirmLoading && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            )}
            {confirmLoading ? "Uploading..." : "Confirm Upload"}
          </button>
        </div>

      </div>
    </div>
  );
}
