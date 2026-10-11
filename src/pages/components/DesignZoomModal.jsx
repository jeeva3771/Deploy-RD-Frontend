import React from "react";

export default function ZoomModal({ imageUrl, onClose }) {
  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex justify-center items-center"
      style={{ zIndex: 10000 }}
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-[90%]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-white rounded-full p-1 shadow"
        >
          ✕
        </button>

        <img
          src={imageUrl}
          alt="Zoom View"
          className="w-full max-h-[90vh] object-contain rounded-lg"
        />
      </div>
    </div>
  );
}
